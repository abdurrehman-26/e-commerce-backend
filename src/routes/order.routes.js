import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getOrderByNoAdmin,
  getOrderSummary,
  GetMyOrderDetails,
} from "../controllers/order.controller.js";
import { verifyJWT, blockunAuth, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/").post(verifyJWT, blockunAuth, createOrder)
router.route("/get-table-orders").get(verifyJWT, blockunAuth, adminOnly, getAllOrders);
router.route("/my-orders").get(verifyJWT, blockunAuth, getMyOrders);
router.route("/order-summary/:confirmationToken").get(verifyJWT, blockunAuth, getOrderSummary);
router.route("/:orderNo").get(verifyJWT, blockunAuth, adminOnly, getOrderByNoAdmin);
router.route("/my-order-details/:orderIdQuery").get(verifyJWT, blockunAuth, GetMyOrderDetails);
router.route("/:orderNo/status").put(verifyJWT, blockunAuth, adminOnly, updateOrderStatus);
router.route("/:orderNo/payment-status").put(verifyJWT, blockunAuth, adminOnly, updateOrderPaymentStatus);

export default router;
