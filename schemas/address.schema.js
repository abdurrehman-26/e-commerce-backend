import mongoose from "mongoose";

export const addressSchema = new mongoose.Schema({
  addressName: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: {
    _id: false,
    name: String,
    code: String
  }, required: true },
  isDefault: { type: Boolean, default: false },
}, {timestamps: true});