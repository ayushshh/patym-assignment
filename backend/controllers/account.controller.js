import { Account } from "../db.schema.js";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import mongoose from "mongoose";

// Only require what the user actually sends in the body
const zodSchema = z.object({
    toAccountId: z.string().min(5).max(40),
    amount: z.number().positive("Amount must be positive").min(1)
});

export const Balance = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id; 
        
        const balanceDetails = await Account.findOne({ userId: userId });
        
        if (!balanceDetails) {
            return res.status(404).json({
                message: "Account not found"
            });
        }
        
        return res.status(200).json({
            message: "Account fetched successfully!!",
            balance: balanceDetails.balance
        });
    } catch (error) {
        console.error("Balance fetch error:", error);
        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});

export const transaction = asyncHandler(async (req, res) => {
    // 1. Start the session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Validate input
        const parsedData = zodSchema.safeParse(req.body);
        if (!parsedData.success) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Invalid data input. Please check your input parameters.",
                errors: parsedData.error.format(), 
            });
        }

        const { toAccountId, amount } = parsedData.data;
        const senderUserId = req.user._id;

        // 3. Fetch sender account (ensure session is attached)
        const senderAccount = await Account.findOne({ userId: senderUserId }).session(session);
        
        if (!senderAccount || senderAccount.balance < amount) {
            // MUST abort, not commit
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Insufficient balance or sender account not found!!"
            });
        }

        // 4. Fetch receiver account
        const receiverAccount = await Account.findOne({ userId: toAccountId }).session(session);
        
        if (!receiverAccount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                message: "Receiver account not found",
            });
        }

        // 5. Perform the transfers using the specific _id of the account documents
        await Account.findByIdAndUpdate(
            senderAccount._id, 
            { $inc: { balance: -amount } }
        ).session(session);

        await Account.findByIdAndUpdate(
            receiverAccount._id, 
            { $inc: { balance: amount } }
        ).session(session);

        // 6. Commit the transaction
        await session.commitTransaction();
        session.endSession();
        
        return res.status(200).json({
            message: "Transaction successful!! 🎉🎉"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction Error:", error);
        
        return res.status(500).json({
            message: "Transaction aborted❌"
        });
    }
});