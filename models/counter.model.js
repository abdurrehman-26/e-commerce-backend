import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 9999 },
});

export const Counter = mongoose.model("Counter", counterSchema);
