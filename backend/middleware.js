import jwt from "jsonwebtoken"
import {User} from "./db.schema.js"
import asyncHandler from "express-async-handler"

export const verify = asyncHandler(async (req, res, next) => {
    let token;

    if(req.cookies.token){
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if(token){
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded._id).select("-password");
             if (!req.user) {
                res.status(401);
                throw new Error('User not found');
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }else{
        res.status(401);
        throw new Error('Not authorized, no token');
    }
})