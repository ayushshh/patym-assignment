import { User } from "../db.schema.js";
import { z } from "zod";
import { asyncHandler } from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const zodSchema = z.object({
  username: z
    .string()
    .min(3, "username should be minimum 3 character")
    .max(50, "username maax length should be 50 characters")
    .toLowerCase()
    .trim(),
  firstName: z
    .string()
    .min(3, "should be atlezst 3 character")
    .max(20, "maximum length should be 20 character")
    .trim(),
  lastName: z
    .string()
    .min(3, "should be atlezst 3 character")
    .max(20, "maximum length should be 20 character")
    .trim(),
  password: z
    .string()
    .min(6, "password length should be minimum 6 character")
    .trim()
    .max(30, "maximum password length should be 30"),
});

const signinZod = z.object({
  username: z
    .string()
    .min(3, "username should be minimum 3 character")
    .max(50, "username maax length should be 50 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "password length should be minimum 6 character")
    .trim()
    .max(30, "maximum password length should be 30"),
});

function jwtAuth(username) {
  if (!username) {
    console.log("pass the username for creation of jwt");
    return;
  }
  const auth = jwt.sign({ username }, process.env.JWT_SECRET);
  return auth;
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Render + Vercel are HTTPS
  sameSite: "None", // required for cross-origin cookies
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const signUp = asyncHandler(async (req, res) => {
  //take all details from user
  //check for the user if the user already exist
  //check using the zod validation
  //check all the fiels is valid or invalid
  //hash the password
  //create jwt
  const { username, firstName, lastName, password } = await req.body;
  if (!username || firstName || lastName || password) {
    return res.status(400).jso({
      message: "Please fill the details",
    });
  }

  const data = zodSchema.safeParse({
    username,
    firstName,
    lastName,
    password,
  });

  if (data.success) {
    ((username = data.data.username),
      (firstName = data.data.firstName),
      (lastName = data.data.lastName),
      (password = data.data.password));
  } else {
    return res.status(400).json({
      message: "invalid data input and change you input",
    });
  }

  const usernameExist = await User.findOne({
    username: username,
  });
  if (usernameExist) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashPassword = bcrypt.hash(password, 10);

  const createUser = await User.create({
    firstName: firstName,
    lastName: lastName,
    username: username,
    password: hashPassword,
  });

  if (createUser) {
    const token = jwtAuth(createUser._id);

    return res.status(200).cookies("token", token, cookieOptions).json({
      messaage: "User created successfully",
      id: createUser._id,
      username,
      firstName,
      lastName,
    });
  }
});

const signin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username | !password) {
    return res.status(400).jso({
      message: "Please fill the details",
    });
  }

  const data = signinZod.safeParse({
    username,
    password,
  });
  if (data.success) {
    ((username = data.data.username), (password = data.data.password));
  } else {
    return res.status(400).json({
      message: "invalid data input and change you input",
    });
  }

  const find = await User.findOne({ username });
  if (find && bcrypt.compare(password, 10)) {
    const token = jwtAuth(username);

    return res
      .status(200)
      .cookies("token", token, cookieOptions)
      .json({
        messaage: `${username} login successfully!!`,
        _id: find._id,
        firstname: find.firstName,
        lastname: find.lastName,
      });
  } else {
    return res.status(400).json({
      message: "Something went wrong",
    });
  }
});
