// controllers/cart.controller.js

import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { buildCartQuery, getNormalizedCart } from "../helpers/cart.helpers.js";

// GET CART
export const getCart = async (req, res) => {
  try {
    const cartQuery = buildCartQuery(req);

    const cart = await Cart.findOne(cartQuery);

    if (!cart) {
      return res.status(200).json({
        status: "success",
        message: "cart fetched successfullly",
        cart: {items: []}
      });
    }

    if (cart.items.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "cart fetched successfullly",
        cart: {items: []}
      });
    }

    const enrichedCart = await getNormalizedCart(cart._id)

    if (cart && !req.user && req.guestID) {
      await Cart.findByIdAndUpdate(
        cart._id,
        { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // example
        { new: true }
      );
    }

    res.status(200).json({
      status: "success",
      cart: enrichedCart,
      message: "cart fetched successfullly",
    });
  } catch (error) {
    console.error("Error in getCart:", error);
    res
      .status(500)
      .json({ status: "failed", message: "Something went wrong on server" });
  }
};

// ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const { productID, quantity } = req.body;
    const cartQuery = buildCartQuery(req);

    if (
      !mongoose.Types.ObjectId.isValid(productID) ||
      typeof quantity !== "number" ||
      quantity <= 0
    ) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid input" });
    }

    const product = await Product.findById(productID);
    if (!product)
      return res
        .status(404)
        .json({ status: "failed", message: "Product not found" });

    let cart = await Cart.findOne(cartQuery);
    if (!cart) cart = new Cart({ ...cartQuery, items: [] });

    const existsIndex = cart.items.findIndex((item) =>
      item.productID.equals(productID)
    );

    if (existsIndex !== -1) {
      cart.items[existsIndex].quantity += quantity;
    } else {
      cart.items.push({ productID, quantity });
    }

    if (!req.user && req.guestID) {
      cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const saved = await cart.save();
    if (!saved)
      return res
        .status(500)
        .json({ status: "failed", message: "Failed to save cart" });

    const updatedCart = await getNormalizedCart(cart._id)

    res.status(200).json({
      status: "success",
      message: "Product added to cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res
      .status(500)
      .json({ status: "failed", message: "Something went wrong on server" });
  }
};

// UPDATE CART ITEM
export const updateCartItem = async (req, res) => {
  try {
    const { quantity, productID } = req.body;
    const cartQuery = buildCartQuery(req);

    if (!productID || !mongoose.Types.ObjectId.isValid(productID)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid or missing product ID" });
    }
    if (typeof quantity !== "number" || quantity < 0) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid quantity" });
    }

    const cart = await Cart.findOne(cartQuery);
    if (!cart)
      return res
        .status(404)
        .json({ status: "failed", message: "Cart not found" });

    const pid = new mongoose.Types.ObjectId(productID);
    const index = cart.items.findIndex((item) => item.productID.equals(pid));
    if (index === -1)
      return res
        .status(404)
        .json({ status: "failed", message: "Item not found in cart" });

    if (quantity === 0) {
      cart.items = cart.items.filter((item) => !item.productID.equals(pid));
    } else {
      cart.items[index].quantity = quantity;
    }

    if (!req.user && req.guestID) {
      cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const savedCart = await cart.save();

    if (savedCart.items.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "cart Item updated successfully",
        cart: {items: []}
      });
    }

    const updatedCart = await getNormalizedCart(cart._id)
    res.status(200).json({
      status: "success",
      message: quantity === 0 ? "Item removed from cart" : "Cart updated successfully",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};

// REMOVE FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const { productID } = req.body;
    const cartQuery = buildCartQuery(req);

    if (!mongoose.Types.ObjectId.isValid(productID)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid product ID" });
    }

    const cart = await Cart.findOne(cartQuery);
    if (!cart)
      return res
        .status(404)
        .json({ status: "failed", message: "Cart not found" });

    const exists = cart.items.some((item) => item.productID.equals(productID));
    if (!exists)
      return res
        .status(404)
        .json({ status: "failed", message: "Product not in cart" });

    cart.items = cart.items.filter((item) => !item.productID.equals(productID));

    if (!req.user && req.guestID) {
      cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const savedCart = await cart.save();

    if (savedCart.items.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "Item removed from cart successfullly",
        cart: { items: []}
      });
    }

    const updatedCart = await getNormalizedCart(cart._id)

    res.status(200).json({
      status: "success",
      message: "Item removed from cart successfullly",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};

// CLEAR CART
export const clearCart = async (req, res) => {
  try {
    const cartQuery = buildCartQuery(req);

    const cart = await Cart.findOne(cartQuery);
    if (!cart)
      return res
        .status(404)
        .json({ status: "failed", message: "Cart not found" });

    cart.items = [];

    if (!req.user && req.guestID) {
      cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const updatedCart = await cart.save();

    res
      .status(200)
      .json({ status: "success", message: "Cart cleared", cart:updatedCart });
  } catch (error) {
    console.error("Error in clearCart:", error);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};