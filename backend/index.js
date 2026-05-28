import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connect } from "./db.schema.js";

import userRouter from "./routes/user.routes.js";
import transactionRouter from "./routes/account.routes.js";

dotenv.config({
    path: "./.env" 
});

const app = express();

// 1. REGISTER MIDDLEWARE FIRST
app.use(express.json({ limit: "10kb" }));
app.use(cors({
    origin: "*"
}));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 2. REGISTER ROUTES SECOND
app.use("/api/v1/user", userRouter);
app.use("/api/v1/transaction", transactionRouter);

// 3. CONNECT DB & START SERVER LAST
connect()
    .then(() => {
        app.listen(3000, () => {
            console.log("App is listening at port 3000 🚀");
        });
    })
    .catch((error) => {
        console.log("Error while connecting to the DB and server: ", error);
        process.exit(1);
    });