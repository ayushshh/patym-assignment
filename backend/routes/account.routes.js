import { Router } from "express";
import { verify } from "../middleware.js"
import {transaction, Balance} from "../controllers/account.controller.js"

const router = Router();

router.route("/payment").post(verify, transaction);
router.route("/balance").get(verify, Balance);

export default router;