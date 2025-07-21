import mongoose from "mongoose";

// Mongoose-style schema
const productSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  images: {
    type: [String],
    required: true,
  },
  price: {
  type: Number,
  required: true,
  },
  compare_at_price: {
  type: Number,
  required: true,
  },
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);