const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Email = require("./models/Email");
const User = require("./models/user");
const Campaign = require("./models/Campaign");

dotenv.config();

const app = express();

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ============================================
// MONGODB CONNECTION
// ============================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("❌ MongoDB connection error:");
    console.log(error.message);
  });

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login.",
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login.",
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET,
      (error, user) => {
        if (error) {
          return res.status(403).json({
            success: false,
            message: "Invalid or expired token.",
          });
        }

        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.log("❌ Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
}

// ============================================
// ROOT ROUTE
// ============================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BulkMail Backend is running",
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    backend: true,
    mongodb:
      mongoose.connection.readyState === 1,
  });
});

// ============================================
// ADMIN LOGIN
// ============================================

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ----------------------------------------
    // Validate request
    // ----------------------------------------

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    // ----------------------------------------
    // Check JWT secret
    // ----------------------------------------

    if (!process.env.JWT_SECRET) {
      console.log("❌ JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "JWT configuration is missing.",
      });
    }

    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await User.findOne({
      username: username.trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // ----------------------------------------
    // Compare password
    // ----------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // ----------------------------------------
    // Generate JWT
    // ----------------------------------------

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    console.log(
      `✅ Login successful: ${user.username}`
    );

    // ----------------------------------------
    // Send response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      username: user.username,
    });
  } catch (error) {
    console.log("❌ Login error:");
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ============================================
// SEND EMAIL
// ============================================

app.post(
  "/sendemail",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        subject,
        msg,
        emails,
      } = req.body;

      console.log("================================");
      console.log("📧 SEND EMAIL REQUEST");
      console.log("Subject:", subject);
      console.log("Message:", msg);
      console.log("Email List:", emails);
      console.log("================================");

      // ----------------------------------------
      // Validate subject
      // ----------------------------------------

      if (
        !subject ||
        typeof subject !== "string" ||
        subject.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Subject is required.",
        });
      }

      // ----------------------------------------
      // Validate message
      // ----------------------------------------

      if (
        !msg ||
        typeof msg !== "string" ||
        msg.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Message is required.",
        });
      }

      // ----------------------------------------
      // Validate emails
      // ----------------------------------------

      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Email list is empty.",
        });
      }

      // ----------------------------------------
      // Clean email list
      // ----------------------------------------

      const emailList = [
        ...new Set(
          emails
            .map((email) =>
              String(email).trim().toLowerCase()
            )
            .filter((email) => email !== "")
        ),
      ];

      if (emailList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid email addresses found.",
        });
      }

      // ----------------------------------------
      // Basic email validation
      // ----------------------------------------

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const invalidEmails = emailList.filter(
        (email) => !emailRegex.test(email)
      );

      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address found.",
          invalidEmails,
        });
      }

      // ----------------------------------------
      // Check MongoDB connection
      // ----------------------------------------

      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({
          success: false,
          message: "MongoDB is not connected.",
        });
      }

      // ----------------------------------------
      // Get Gmail credentials from MongoDB
      // ----------------------------------------

      const emailData = await Email.findOne();

      if (!emailData) {
        console.log(
          "❌ Email credentials not found in MongoDB"
        );

        return res.status(500).json({
          success: false,
          message:
            "Email credentials not found in MongoDB.",
        });
      }

      if (
        !emailData.email ||
        !emailData.password
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Email credentials are incomplete.",
        });
      }

      console.log(
        "📨 Gmail account:",
        emailData.email
      );

      // ----------------------------------------
      // Create Nodemailer transporter
      // ----------------------------------------

      const transporter =
        nodemailer.createTransport({
          service: "gmail",

          auth: {
            user: emailData.email,
            pass: emailData.password,
          },
        });

      // ----------------------------------------
      // Verify Gmail connection
      // ----------------------------------------

      try {
        await transporter.verify();

        console.log(
          "✅ Gmail transporter verified"
        );
      } catch (error) {
        console.log(
          "❌ Gmail transporter verification failed:"
        );

        console.log(error.message);

        return res.status(500).json({
          success: false,
          message:
            "Unable to connect to Gmail. Check email credentials.",
        });
      }

      // ----------------------------------------
      // Create campaign
      // ----------------------------------------

      const campaign = await Campaign.create({
        subject: subject.trim(),
        body: msg.trim(),
        recipients: emailList,
        status: "pending",
      });

      // ----------------------------------------
      // Counters
      // ----------------------------------------

      let sentCount = 0;
      let failedCount = 0;

      // ----------------------------------------
      // Send emails one by one
      // ----------------------------------------

      for (const recipient of emailList) {
        try {
          const info =
            await transporter.sendMail({
              from: emailData.email,
              to: recipient,
              subject: subject.trim(),
              text: msg.trim(),
            });

          console.log(
            `✅ Email sent: ${recipient}`
          );

          console.log(
            "Message ID:",
            info.messageId
          );

          sentCount++;
        } catch (error) {
          console.log(
            `❌ Failed to send: ${recipient}`
          );

          console.log(error.message);

          failedCount++;
        }
      }

      // ----------------------------------------
      // Determine campaign status
      // ----------------------------------------

      let campaignStatus;

      if (sentCount === emailList.length) {
        campaignStatus = "success";
      } else if (sentCount === 0) {
        campaignStatus = "failed";
      } else {
        campaignStatus = "partial";
      }

      // ----------------------------------------
      // Update campaign
      // ----------------------------------------

      campaign.sent = sentCount;
      campaign.failed = failedCount;
      campaign.status = campaignStatus;

      await campaign.save();

      // ----------------------------------------
      // Response
      // ----------------------------------------

      return res.status(200).json({
        success: true,
        message: "Email process completed",
        status: campaignStatus,
        total: emailList.length,
        sent: sentCount,
        failed: failedCount,
        campaignId: campaign._id,
      });
    } catch (error) {
      console.log(
        "❌ Send email error:"
      );

      console.log(error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// ============================================
// EMAIL HISTORY
// ============================================

app.get(
  "/history",
  authenticateToken,
  async (req, res) => {
    try {
      const campaigns =
        await Campaign.find()
          .sort({
            createdAt: -1,
          });

      return res.status(200).json(
        campaigns
      );
    } catch (error) {
      console.log(
        "❌ History error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch history.",
      });
    }
  }
);

// ============================================
// GET SINGLE CAMPAIGN
// ============================================

app.get(
  "/history/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const campaign =
        await Campaign.findById(
          req.params.id
        );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message:
            "Campaign not found.",
        });
      }

      return res.status(200).json(
        campaign
      );
    } catch (error) {
      console.log(
        "❌ Get campaign error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// ============================================
// 404 ROUTE
// ============================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.log(
      "❌ Global error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
);

// ============================================
// LOCAL SERVER
// ============================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `🚀 Server started on port ${PORT}`
    );
  });
}

// ============================================
// VERCEL EXPORT
// ============================================

module.exports = app;