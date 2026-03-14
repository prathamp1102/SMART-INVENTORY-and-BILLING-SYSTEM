const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dns = require("dns");
require("dotenv").config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const UserModel = require("./models/usermodel");

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("MongoDB Connected");

    // Clear existing users
    await UserModel.deleteMany();
    console.log("Existing users cleared");

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Insert users
    await UserModel.insertMany([
      {
        name: "Super Admin",
        email: "superadmin@gmail.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      {
        name: "Admin User",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
      {
        name: "Staff User",
        email: "staff@gmail.com",
        password: hashedPassword,
        role: "STAFF",
        isActive: true,
      },
    ]);

    console.log("✅ Users inserted successfully!");
    process.exit();
  } catch (error) {
    console.error("Seeder Error:", error.message);
    process.exit(1);
  }
};

seedData();