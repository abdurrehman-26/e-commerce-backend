import express from "express";
import { generateCloudinarySignature } from "../controllers/cloudinary.controller.js";

const router = express.Router();

router.post('/signature', generateCloudinarySignature)

export default router