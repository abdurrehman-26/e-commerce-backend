import express from "express"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import productRouter from "./routes/product.routes.js"
import orderRouter from "./routes/order.routes.js";
import cartRouter from "./routes/cart.routes.js";
import checkoutRouter from "./routes/checkout.routes.js";
import cloudinaryRouter from "./routes/cloudinary.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import stripeWebhookRouter from "./routes/stripeWebhook.routes.js";
import cors from "cors"
const app = express()

const allowedOrigin = process.env.ALLOWED_CORS_ORIGIN

if (!allowedOrigin || allowedOrigin.length === 0) {
  throw new Error("ALLOWED_CORS_ORIGIN not set in .env")
}

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(cookieParser(process.env.COOKIE_SIGNING_SECRET))

app.use("/api/v1/stripe", stripeWebhookRouter);
app.use(express.json())

app.use("/api/v1/user", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/api/v1/cloudinary", cloudinaryRouter);
app.use("/api/v1/payments", paymentRouter);

export {app}