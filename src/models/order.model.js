import mongoose from "mongoose";
import { addressSchema } from "../schemas/address.schema.js";

const orderItemSchema = new mongoose.Schema({
  productID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNo: { type: Number, required: true, unique: true, index: true },

  items: [orderItemSchema],

  shippingAddress: addressSchema,

  billingAddress: addressSchema,

  paymentMethod: {
  type: String,
  enum: ['cash_on_delivery', 'card'],
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  stripePaymentId: {
    type: String,
    index: true, // helpful for refund tracking / audits
  },
  paymentConfirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  confirmationToken: {type: String, required: true},
  paidAt: { type: Date },
  subTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  shippingCost: { type: Number, required: true },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },

}, { timestamps: true });

export const Order = mongoose.model("Order", orderSchema);
