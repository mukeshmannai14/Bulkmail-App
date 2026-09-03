const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    recipients: {
      type: [String],
      required: true,
    },

    sent: {
      type: Number,
      default: 0,
    },

    failed: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "success", "partial", "failed"],
      default: "pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);