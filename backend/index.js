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
// MongoDB
// ============================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection error:");
    console.log(error.message);
  });


// ============================================
// Authentication Middleware
// ============================================

function authenticateToken(req, res, next) {

  const authHeader = req.headers["authorization"];

  const token =
    authHeader &&
    authHeader.split(" ")[1];

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

}


// ============================================
// ADMIN LOGIN
// ============================================

app.post("/auth/login", async (req, res) => {

  try {

    const {
      username,
      password,
    } = req.body;


    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!username || !password) {

      return res.status(400).json({
        success: false,
        message:
          "Username and password are required.",
      });

    }


    // ----------------------------------------
    // Check JWT Secret
    // ----------------------------------------

    if (!process.env.JWT_SECRET) {

      console.log(
        "JWT_SECRET is missing"
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT configuration is missing.",
      });

    }


    // ----------------------------------------
    // Find User
    // ----------------------------------------

    const user = await User.findOne({
      username: username.trim(),
    });


    if (!user) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });

    }


    // ----------------------------------------
    // Compare Password
    // ----------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });

    }


    // ----------------------------------------
    // Create JWT Token
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
      "Login successful:",
      user.username
    );


    // ----------------------------------------
    // Response
    // ----------------------------------------

    return res.status(200).json({

      success: true,

      message:
        "Login successful",

      token: token,

      username:
        user.username,

    });

  } catch (error) {

    console.log(
      "Login error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Server error",

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


      // ========================================
      // EMAIL LIST
      // ========================================

      const emailList = Array.isArray(emails)
        ? emails
        : [];


      console.log(
        "================================"
      );

      console.log(
        "Message:",
        msg
      );

      console.log(
        "Subject:",
        subject
      );

      console.log(
        "Email List:",
        emailList
      );

      console.log(
        "================================"
      );


      // ========================================
      // Validation
      // ========================================

      if (
        !subject ||
        subject.trim() === ""
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Subject is required.",
        });

      }


      if (
        !msg ||
        msg.trim() === ""
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Message is required.",
        });

      }


      if (
        emailList.length === 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Email list is empty.",
        });

      }


      // ========================================
      // Clean Email List
      // ========================================

      const cleanEmailList = [
        ...new Set(
          emailList
            .map((email) =>
              String(email)
                .trim()
                .toLowerCase()
            )
            .filter(
              (email) =>
                email !== ""
            )
        ),
      ];


      if (
        cleanEmailList.length === 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "No valid email addresses found.",
        });

      }


      // ========================================
      // Get Gmail Credentials
      // ========================================

      const emailData =
        await Email.findOne();


      if (!emailData) {

        console.log(
          "Email credentials not found in MongoDB"
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
        "Gmail user found:",
        emailData.email
      );


      // ========================================
      // Create Transporter
      // ========================================

      const transporter =
        nodemailer.createTransport({

          service: "gmail",

          auth: {

            user:
              emailData.email,

            pass:
              emailData.password,

          },

        });


      // ========================================
      // Verify Gmail
      // ========================================

      try {

        await transporter.verify();

        console.log(
          "Gmail transporter verified successfully"
        );

      } catch (error) {

        console.log(
          "Gmail transporter error:",
          error.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to connect to Gmail. Check email credentials.",
        });

      }


      // ========================================
      // Create Campaign
      // ========================================

      const campaign =
        await Campaign.create({

          subject:
            subject.trim(),

          body:
            msg.trim(),

          recipients:
            cleanEmailList,

          status:
            "pending",

        });


      // ========================================
      // Counters
      // ========================================

      let sentCount = 0;

      let failedCount = 0;


      // ========================================
      // Send Emails
      // ========================================

      for (
        let i = 0;
        i < cleanEmailList.length;
        i++
      ) {

        try {

          const info =
            await transporter.sendMail({

              from:
                emailData.email,

              to:
                cleanEmailList[i],

              subject:
                subject.trim(),

              text:
                msg.trim(),

            });


          console.log(
            "Email sent:",
            cleanEmailList[i]
          );


          console.log(
            "Message ID:",
            info.messageId
          );


          sentCount++;

        } catch (error) {

          console.log(
            "Failed to send:",
            cleanEmailList[i]
          );


          console.log(
            error.message
          );


          failedCount++;

        }

      }


      // ========================================
      // Determine Campaign Status
      // ========================================

      let campaignStatus;


      if (
        sentCount ===
        cleanEmailList.length
      ) {

        campaignStatus =
          "success";

      } else if (
        sentCount === 0
      ) {

        campaignStatus =
          "failed";

      } else {

        campaignStatus =
          "partial";

      }


      // ========================================
      // Update Campaign
      // ========================================

      campaign.sent =
        sentCount;

      campaign.failed =
        failedCount;

      campaign.status =
        campaignStatus;


      await campaign.save();


      // ========================================
      // Response
      // ========================================

      return res.status(200).json({

        success: true,

        message:
          "Email process completed",

        status:
          campaignStatus,

        total:
          cleanEmailList.length,

        sent:
          sentCount,

        failed:
          failedCount,

        campaignId:
          campaign._id,

      });

    } catch (error) {

      console.log(
        "Send email error:"
      );

      console.log(error);


      return res.status(500).json({

        success: false,

        message:
          "Server error",

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
        "History error:",
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
        "Get campaign error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Server error",

      });

    }

  }
);


// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {

  res.json({

    success: true,

    message:
      "BulkMail Backend is running",

  });

});


// ============================================
// 404 ROUTE
// ============================================

app.use((req, res) => {

  res.status(404).json({

    success: false,

    message:
      `Route ${req.method} ${req.originalUrl} not found.`,

  });

});


// ============================================
// SERVER
// ============================================

// Local development

if (require.main === module) {

  app.listen(
    PORT,
    () => {

      console.log(
        `Server started on port ${PORT}`
      );

    }
  );

}


// ============================================
// VERCEL
// ============================================

module.exports = app;