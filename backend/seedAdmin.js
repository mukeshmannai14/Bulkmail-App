const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/user");

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const existingUser = await User.findOne({
      username: "admin",
    });

    if (existingUser) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      username: "admin",
      password: hashedPassword,
    });

    console.log("Admin created successfully");
    console.log("Username: admin");
    console.log("Password: admin123");

    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

createAdmin();