
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

async function seedAdmin(): Promise<void> {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
    );
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error(
      "Admin password must be between 12 and 128 characters"
    );
  }

  await connectDB();

  const existingUser = await User.findOne({ email }).select("+passwordHash");

  if (existingUser) {
    throw new Error(
      "This email already exists. No account was changed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log("Initial Admin account created successfully.");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error(
      "Admin setup failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
