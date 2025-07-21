import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import { addressSchema } from "../schemas/address.schema.js";

const checkoutSessionSchema = new mongoose.Schema({
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(), // public, unguessable
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [
      {
        _id: false,
        productID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    shippingAddress: {type: addressSchema, required: true },
    billingAddress: {type: addressSchema, required: true },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
})

// TTL index to auto-delete after expiry
checkoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CheckoutSession = mongoose.model("CheckoutSession", checkoutSessionSchema);