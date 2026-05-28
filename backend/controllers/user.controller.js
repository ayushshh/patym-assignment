import { User } from "../db.schema.js";
import { z } from "zod";
import asyncHandler from "express-async-handler"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Account } from "../db.schema.js"

// --- Zod Schemas ---
const zodSchema = z.object({
  username: z
    .string()
    .min(3, "Username should be a minimum of 3 characters")
    .max(50, "Username maximum length should be 50 characters")
    .toLowerCase()
    .trim(),
  firstName: z
    .string()
    .min(3, "First name should be at least 3 characters")
    .max(20, "Maximum length should be 20 characters")
    .trim(),
  lastName: z
    .string()
    .min(3, "Last name should be at least 3 characters")
    .max(20, "Maximum length should be 20 characters")
    .trim(),
  password: z
    .string()
    .min(6, "Password length should be a minimum of 6 characters")
    .max(30, "Maximum password length should be 30 characters")
    .trim(),
});

const signinZod = z.object({
  username: z
    .string()
    .min(3, "Username should be a minimum of 3 characters")
    .max(50, "Username maximum length should be 50 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Password length should be a minimum of 6 characters")
    .max(30, "Maximum password length should be 30 characters")
    .trim(),
});

const updateBody = z.object({
  password: z.string().min(6).max(30).optional(),
  firstName: z.string().min(3).max(20).optional(),
  lastName: z.string().min(3).max(20).optional(),
});

// --- Helpers ---
function jwtAuth(id) {
  if (!id) {
    console.error("Pass the user ID for the creation of JWT");
    return;
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

const cookieOptions = {
  httpOnly: true,
  // secure: process.env.NODE_ENV === "production",
  sameSite: "None",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// --- Controllers ---

export const signUp = asyncHandler(async (req, res) => {
  // 1. Check if fields are provided
  const { username, firstName, lastName, password } = req.body;
  if (!username || !firstName || !lastName || !password) {
    return res.status(400).json({
      message: "Please fill in all details",
    });
  }

  // 2. Validate with Zod
  const parsedData = zodSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid data input. Please check your input parameters.",
      errors: parsedData.error.format(), // Optional: helps debug what exactly failed
    });
  }

  const validData = parsedData.data;

  // 3. Check for existing user
  const usernameExist = await User.findOne({ username: validData.username });
  if (usernameExist) {
    return res.status(400).json({ message: "User already exists" });
  }

  // 4. Hash password (MUST use await)
  const hashPassword = await bcrypt.hash(validData.password, 10);

  // 5. Create user
  const createUser = await User.create({
    firstName: validData.firstName,
    lastName: validData.lastName,
    username: validData.username,
    password: hashPassword,
  });

  let acc;
  if(createUser){
    acc = await Account.create({
      userId : createUser._id,
      balance: Math.floor(Math.random()*10) * 1000
    })
  }

  // 6. Generate token and respond
  if (createUser && acc) {
    const token = jwtAuth(createUser._id);

    return res.status(201).cookie("token", token, cookieOptions).json({
      message: "User created successfully",
      id: createUser._id,
      username: createUser.username,
      firstName: createUser.firstName,
      lastName: createUser.lastName,
      balance : acc.balance
    });
  }
});

export const signin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Please fill in all details",
    });
  }

  const parsedData = signinZod.safeParse({ username, password });
  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid data input. Please check your input parameters.",
    });
  }

  const validData = parsedData.data;

  // Find user and compare password (MUST compare against DB password and use await)
  const user = await User.findOne({ username: validData.username });

  if (user && (await bcrypt.compare(validData.password, user.password))) {
    const token = jwtAuth(user._id); // Use ID, not username

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({
        message: `${user.username} logged in successfully!!`,
        _id: user._id,
        firstname: user.firstName,
        lastname: user.lastName,
      });
  } else {
    // Keep error message generic for security reasons
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }
});

export const update = asyncHandler(async (req, res) => {
  const { firstName, lastName, password } = req.body;

  if (!firstName && !lastName && !password) {
    return res.status(400).json({
      message: "No data provided to update",
    });
  }

  const parsedData = updateBody.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({
      message: "Invalid data format",
    });
  }

  // Build the update object dynamically so we only update what was passed
  const updateFields = {};
  if (parsedData.data.firstName)
    updateFields.firstName = parsedData.data.firstName;
  if (parsedData.data.lastName)
    updateFields.lastName = parsedData.data.lastName;

  // Only hash and update the password if the user actually sent a new one
  if (parsedData.data.password) {
    updateFields.password = await bcrypt.hash(parsedData.data.password, 10);
  }

  // Note: req.user._id assumes you have an authentication middleware running before this controller
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true },
  ).select("-password");

  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({
    message: "Details updated successfully",
    details: updatedUser,
  });
});

//this is for the finding the user using a simple
const findUser = asyncHandler(async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};
    if (filter) {
      //this is query for finding
      query = {
        $or: [
          { firstName: { $regex: filter, $options: "i" } },
          { lastName: { $regex: filter, $options: "i" } },
        ],};}
    const users = await User.find(query).select("firstName lastName _id");

    res.status(200).json({ users });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
