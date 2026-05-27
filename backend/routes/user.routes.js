import { Router } from "express";
import { signUp, signin, update } from "../controllers/user.controller.js"
import { verify } from "../middleware.js"
const router = Router();

router.route("/sign-in").post(signin);
router.route("/sign-up").post(signUp);
router.route("/change-details").patch(verify, update)

export default router;