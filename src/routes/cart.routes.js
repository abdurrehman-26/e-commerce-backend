// routes/cartRoutes.js
import express from "express";
import { getCart, addToCart, removeFromCart, updateCartItem, clearCart } from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { identifyGuest } from "../middlewares/guestIdentifier.middleware.js";

const router = express.Router();

router.use(verifyJWT)

router.use(identifyGuest)

router.route("/").get(getCart).post(addToCart);
router.route("/").patch(updateCartItem);
router.route("/").delete(removeFromCart);
router.route("/clear").delete(clearCart);

export default router;
