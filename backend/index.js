import express from "express";
import { connect } from "./db.schema.js";
import cors from cors;
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

dotenv.config({
    path: "./env"
})

const app = express();

connect()
.then(() => {
    try {
        app.listen(3000, () => {
            console.log("app is listening at port 3000");
        })
    } catch (error) {
        console.log("something went wrong", error);
    }
})
.catch((error) => {
    console.log("error while connecting the db and server", error)
})

app.use(express.json({ limit: "10kb" }));
app.use(cors({
    origin: "*"
}));
app.use(express.urlencoded({extended: true, limit: "10kb"}))
app.use(cookieParser());

import { userRouter } from "./routes/user.routes.js"

app.use("/api/v1/", userRouter);