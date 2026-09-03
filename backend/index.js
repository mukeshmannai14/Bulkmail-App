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

app.use(cors());
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

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please login.",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (error, user) => {

      if (error) {
        return res.status(403).json({
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

app.post("/login", async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {

      return res.status(400).json({
        message: "Username and password are required.",
      });

    }

    const user = await User.findOne({
      username: username,
    });

    if (!user) {

      return res.status(401).json({
        message: "Invalid username or password.",
      });

    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {

      return res.status(401).json({
        message: "Invalid username or password.",
      });

    }

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

    res.json({
      message: "Login successful",
      token: token,
      username: user.username,
    });

  } catch (error) {

    console.log("Login error:", error);

    res.status(500).json({
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
        emailList,
      } = req.body;


      console.log("================================");
      console.log("Message:", msg);
      console.log("Subject:", subject);
      console.log("Email List:", emailList);
      console.log("================================");


      // ----------------------------------------
      // Validation
      // ----------------------------------------

      if (!subject || subject.trim() === "") {

        return res.status(400).json({
          message: "Subject is required.",
        });

      }


      if (!msg || msg.trim() === "") {

        return res.status(400).json({
          message: "Message is required.",
        });

      }


      if (!emailList || emailList.length === 0) {

        return res.status(400).json({
          message: "Email list is empty.",
        });

      }


      // ----------------------------------------
      // Get Gmail credentials from MongoDB
      // ----------------------------------------

      const emailData = await Email.findOne();


      if (!emailData) {

        console.log(
          "Email credentials not found in MongoDB"
        );

        return res.status(500).json({
          message:
            "Email credentials not found in MongoDB.",
        });

      }


      console.log(
        "Gmail user found:",
        emailData.email
      );


      // ----------------------------------------
      // Create transporter
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
      // Create campaign record
      // ----------------------------------------

      const campaign = await Campaign.create({

        subject: subject,

        body: msg,

        recipients: emailList,

        status: "pending",

      });


      let sentCount = 0;

      let failedCount = 0;


      // ----------------------------------------
      // Send emails
      // ----------------------------------------

      for (
        let i = 0;
        i < emailList.length;
        i++
      ) {

        try {

          const info =
            await transporter.sendMail({

              from: emailData.email,

              to: emailList[i],

              subject: subject,

              text: msg,

            });


          console.log(
            "Email sent:",
            emailList[i]
          );

          console.log(
            "Message ID:",
            info.messageId
          );


          sentCount++;

        } catch (error) {

          console.log(
            "Failed to send:",
            emailList[i]
          );

          console.log(
            error.message
          );

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
      // Update MongoDB campaign
      // ----------------------------------------

      campaign.sent = sentCount;

      campaign.failed = failedCount;

      campaign.status = campaignStatus;

      await campaign.save();


      // ----------------------------------------
      // Response
      // ----------------------------------------

      res.json({

        message: "Email process completed",

        status: campaignStatus,

        sent: sentCount,

        failed: failedCount,

        campaignId: campaign._id,

      });


    } catch (error) {

      console.log(
        "Send email error:"
      );

      console.log(error);


      res.status(500).json({

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


      res.json(campaigns);

    } catch (error) {

      console.log(
        "History error:",
        error
      );

      res.status(500).json({

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

          message:
            "Campaign not found.",

        });

      }


      res.json(campaign);

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message: "Server error",

      });

    }

  }
);


// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {

  res.send("BulkMail Backend is running");

});


// ============================================
// SERVER
// ============================================

app.listen(5000, () => {

  console.log(
    "Server started on port 5000"
  );

});