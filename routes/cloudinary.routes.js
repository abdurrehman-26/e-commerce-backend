import express from "express";
import { generateCloudinarySignature } from "../controllers/cloudinary.controller.js";

const router = express.Router();

router.get('/signature', generateCloudinarySignature)

export default router