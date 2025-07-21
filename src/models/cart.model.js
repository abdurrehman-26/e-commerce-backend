// models/Cart.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false }); // Prevents extra _id inside items


const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  guestID: {
    type: String,
  },
  items: [cartItemSchema],

  // Only set for guests, not users
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ guestID: 1 }, { unique: true, sparse: true });

cartSchema.pre("validate", function (next) {
  const hasUser = !!this.user;
  const hasGuest = !!this.guestID;

  if (hasUser === hasGuest) {
    return next(new Error("Cart must belong to either a user or a guest, not both or neither."));
  }

  next();
});

export const Cart = mongoose.model("Cart", cartSchema);
