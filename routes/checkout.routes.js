import express from "express";
import { blockunAuth, verifyJWT } from "../middlewares/auth.middleware.js";
import { createCheckoutSession, getCheckoutSession, updateCheckoutAddresses } from "../controllers/checkout.controller.js";

const router = express.Router()

router.use(verifyJWT)

router.use(blockunAuth)

router.route("/:token").get(getCheckoutSession)
router.route("/create").post(createCheckoutSession)
router.route("/:token/addresses").patch(updateCheckoutAddresses)

export default router;