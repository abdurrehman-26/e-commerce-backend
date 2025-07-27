import { Cart } from "../models/cart.model.js";
import { CheckoutSession } from "../models/checkoutSession.model.js";
import { Product } from "../models/product.model.js";
import { calculateSubtotal } from "../utils/priceCalculator.js";
import { calculateShippingCost } from "../utils/shippingCostCalculator.js";
import { calculateTax } from "../utils/taxCalculator.js";
import { User } from "../models/user.model.js";

export const createCheckoutSession = async (req, res) => {
  const { mode, productID, quantity } = req.body;
  const userId = req.user._id;

  let items = [];

  if (mode === 'cart') {
    const cart = await Cart.findOne({user: userId });

    if (!cart) return res.status(400).json({ status: "failed", message: 'Cart is empty' });

    items = await Promise.all(cart.items.map(async item => {
      const { price } = await Product.findById(item.productID).select("price -_id");
      return {
      productID: item.productID,
      quantity: item.quantity,
      price
    }}))
  } else if (mode === 'buyNow') {
    const product = await Product.findById(productID);
    if (!product) return res.status(404).json({ status: "failed", message: 'Product not found' });

    items.push({
      productID,
      quantity,
      price: product.price
    });
  }

  if (items.length === 0) return res.status(400).json({ error: 'No items to checkout' });

  const user = await User.findOne({_id: userId}).select("addresses")

  const shippingAddress = user.addresses.find((addr) => addr.isDefault === true) || null

  const billingAddress = user.addresses.find((addr) => addr.isDefault === true) || null

  const subtotal = calculateSubtotal(items)

  const tax = calculateTax(subtotal)

  const shipping = calculateShippingCost(shippingAddress)

  const total = subtotal + tax + shipping

  const expiresAt = new Date(Date.now() + 1440 * 60 * 1000); // 15 minute TTL
  const session = await CheckoutSession.create({
    userId,
    items,
    expiresAt,
    subtotal,
    tax,
    shippingAddress,
    billingAddress,
    shipping,
    total
  });

  return res.status(200).json({ status: "success", message: "Checkout session created successfuly", session})
}

export const getCheckoutSession = async (req, res) => {
  const [session] = await CheckoutSession.aggregate([
    {$match: {
      token: req.params.token
      }
    },
    { $unwind: "$items" },

    {
      $lookup: {
        from: "products",
        localField: "items.productID",
        foreignField: "_id",
        as: "product"
      }
    },

    { $unwind: "$product" },

    {
      $addFields: {
        "items.product": {
          _id: "$product._id",
          title: "$product.title",
          price: "$product.price",
          compare_at_price:
            "$product.compare_at_price",
          image: {$first: "$product.images"},
          slug: "$product.slug"
        }
      }
    },

    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        token: { $first: "$token" },
        items: {
          $push: {
            quantity: "$items.quantity",
            price: "$items.price",
            product: "$items.product"
          }
        },
        billingAddress: { $first: "$billingAddress" },
        shippingAddress: { $first: "$shippingAddress" },
        subtotal: { $first: "$subtotal" },
        tax: { $first: "$tax" },
        shipping: { $first: "$shipping" },
        total: { $first: "$total" }
      }
    }
  ])

  if (!session || new Date() > session.expiresAt) {
    return res.status(404).json({ status: "failed", message: 'Checkout session expired or not found' });
  }

  res.status(200).json({ status: "success", message: "Checkout session fetched successfully", session });
}

export const updateCheckoutAddresses = async (req, res) => {
  try {
    const userId = req.user._id; // assuming authentication middleware
    const { token } = req.params;
    const { shippingAddressId, billingAddressId } = req.body;

    // 1. Find the checkout session for this user
    const session = await CheckoutSession.findOne({ token, userId });
    if (!session) {
      return res.status(403).json({ message: "Unauthorized or invalid checkout session." });
    }

    // 2. Fetch user to get embedded addresses
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updateFields = {};

    // 3. Extract shipping address from user's addresses
    if (shippingAddressId) {
      const shippingAddress = user.addresses.find(
        (addr) => String(addr._id) === String(shippingAddressId)
      );
      if (!shippingAddress) {
        return res.status(400).json({ message: "Invalid shipping address ID." });
      }
      updateFields.shippingAddress = shippingAddress;
    }

    // 4. Extract billing address (if provided)
    if (billingAddressId) {
      const billingAddress = user.addresses.find(
        (addr) => String(addr._id) === String(billingAddressId)
      );
      if (!billingAddress) {
        return res.status(400).json({ message: "Invalid billing address ID." });
      }
      updateFields.billingAddress = billingAddress;
    }

    // 5. Update checkout session
    const updatedSession = await CheckoutSession.findOneAndUpdate(
      { token, userId },
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({ status: "success", message: "Checkout addresses updated.", session: updatedSession });
  } catch (error) {
    console.error("Failed to update checkout addresses:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
