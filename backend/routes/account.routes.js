import Router from "express";
import { verify } from "../middleware.js"

const router = Router();

import {transaction, Balance} from "../controllers/account.controller.js"

router.route("/payment").patch(verify, transaction);
router.route("/balance").get(verify, Balance);

export default router;