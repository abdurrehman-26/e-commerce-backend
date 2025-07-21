// controllers/orderController.js
import mongoose from "mongoose";
import { generateConfirmationToken } from "../helpers/order.helpers.js";
import { Cart } from "../models/cart.model.js";
import { CheckoutSession } from "../models/checkoutSession.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { getNextOrderNumber } from "../utils/orderNoGenerator.js";


export const createOrder = async (req, res) => {
  const { checkoutToken, paymentMethod } = req.body;

  try {
    const session = await CheckoutSession.findOne({ token: checkoutToken });
    if (!session) {
      return res.status(404).json({ status: "failed", message: "Checkout session not found" });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: "failed", message: "Unauthorized access" });
    }

    const items = session.items;
    const subTotal = session.subtotal
    const tax = session.tax;
    const shippingCost = session.shipping;
    const total = session.total;
    const orderNo = await getNextOrderNumber();
    const confirmationToken = await generateConfirmationToken() 
    const order = new Order({
      userId: req.user._id,
      orderNo,
      confirmationToken,
      items,
      shippingAddress: session.shippingAddress,
      billingAddress: session.billingAddress,
      subTotal,
      tax,
      shippingCost,
      total,
      paymentMethod,
      status: "pending",
    });

    await order.save();

    await Cart.findOneAndUpdate({
      user: req.user._id,
    }, {
      items: []
    })

    await CheckoutSession.findOneAndDelete({token: checkoutToken})


    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      order
    });

  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

export const getOrderSummary = async (req, res) => {
  const {confirmationToken} = req.params
  if (!confirmationToken) {
    return res.status(500).json({status: "failed", message: "confirmation token not found"})
  }
  const order = await Order.findOne({confirmationToken}).lean()
  if (!order) {
    return res.status(404).json({status: "failed", message: "invalid confirmation token"})
  }
  order.items = await Promise.all(order.items.map(async(item) => {
    const product = await Product.findById(item.productID)
    return {
      title: product.title,
      image: product.images[0],
      quantity: item.quantity,
      price: item.price
    }
  }))
  order.placedOn = order.createdAt
  res.status(200).json({status: "success", message: "order summary fetched successfully", order})
}

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({createdAt: -1}).lean();
    await Promise.all(orders.map(async (order) => {
      order.items = await Promise.all(order.items.map(async(item) => {
        const product = await Product.findById(item.productID)
        return {
          title: product.title,
          image: product.images[0],
          quantity: item.quantity,
          price: item.price
        }
      }))
    }))
    res.json({orders});
  } catch (error) {
    res.status(500).json({status: "failed", message: "something went wrong on server"})
  }
};

export const getOrderByNoAdmin = async (req, res) => {
  const { orderNo } = req.params;

  try {
    const order = await Order.findOne({ orderNo })
      .populate({
        path: "userId",
        select: "-__v -_id -password -createdAt -updatedAt -isEmailVerified -addresses -isAdmin"
      })
      .populate({
        path: "items.productID",
        select: "title images"
      })
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Transform items to desired format
    const items = order.items.map(item => ({
      productID: item.productID._id,
      product: {
        title: item.productID.title,
        image: item.productID.images?.[0] || null,
      },
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    const response = {
      _id: order._id,
      order_no: order.orderNo,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      paymentID: order.stripePaymentId,
      sub_total: order.subTotal,
      tax: order.shippingCost,
      shipping_cost: order.shippingCost,
      total: order.total,
      status: order.status,
      shipping_address: order.shippingAddress,
      billing_address: order.billingAddress,
      created_at: order.createdAt,
      user_details: order.userId,
      items
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "failed",
      message: "Something went wrong on server"
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().select("-userId").lean()
    const orderData = await Promise.all(orders.map(async (order) => {
      const userDetails = await User.findOne(order.userId).select("-__v -_id -password -createdAt -updatedAt -isEmailVerified -addresses -isAdmin")
      return {
        "_id": order._id,
        "order_No": order.orderNo,
        "payment_Method": order.paymentMethod,
        "payment_Status": order.paymentStatus,
        "total": order.total,
        "status": order.status,
        "created_At": order.createdAt,
        "user_Details": userDetails
    }
    }))
    res.json({status: "success", data: orderData});
  } catch (error) {
    res.status(500).json({status: "failed", message: "something went wrong on server", error: error.message})
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderNo } = req.params;
  const { status } = req.body;
  
  const orderStatusFlow = ["pending", "processing", "shipped", "delivered"];

  try {
    const order = await Order.findOne({orderNo});
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "cancelled") {
      return res.status(400).json({status: "failed", message: "target is a cancelled order."})
    }

    if (status === "cancelled") {
      if (["pending", "processing"].includes(order.status)) {
      order.status = "cancelled";
      await order.save();
      return res.json({
      status: "success",
      message: "Order cancelled successfully",
      data: order,
      });
      } else {
        return res.status(400).json({
        message: "Only pending or processing orders can be cancelled.",
    });
  }
    }

    if (!orderStatusFlow.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const currentIndex = orderStatusFlow.indexOf(order.status);
    const newIndex = orderStatusFlow.indexOf(status);

    if (currentIndex === newIndex) {
      return res.status(400).json({
        message: `Already at the status.`,
      });
    }

    // Only allow moving to the next step
    if (newIndex !== currentIndex + 1) {
      return res.status(400).json({
        message: `Invalid transition. Current: ${order.status}, Target: ${status}. You can only move one step forward.`,
      });
    }

    order.status = status;
    await order.save();

    res.json({ status: "success", message: `Order status updated to ${status}`, data: order });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "failed" });
  }
};

export const updateOrderPaymentStatus = async (req, res) => {
  const { orderNo } = req.params;
  const { paymentStatus } = req.body;

  const validStatuses = ['unpaid', 'paid'];

  try {
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const order = await Order.findOne({orderNo});
    if (!order) return res.status(404).json({ message: "Order not found" });

    const current = order.paymentStatus;

    if (current === paymentStatus) {
      return res.status(400).json({
        message: `Payment status is already ${paymentStatus}.`
      });
    }

    if (current === 'paid') {
      return res.status(400).json({
        message: `Cannot change payment status once it's marked as paid.`
      });
    }


    // Define valid transitions
    const validTransitions = {
      unpaid: ['paid'], // optional, allows retrying
      paid: [] // terminal state
    };

    if (!validTransitions[current].includes(paymentStatus)) {
      return res.status(400).json({
        message: `Invalid transition from ${current} to ${paymentStatus}.`
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ status: "success", message: `Payment status updated to ${paymentStatus}`, data: order });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
};

export const GetMyOrderDetails = async (req, res) => {
  const { orderIdQuery } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderIdQuery)) {
    return res.status(404).json({status: "failed", message: "invalid order Id"})
  }

  const orderId = new mongoose.Types.ObjectId(orderIdQuery);

  try {
    const order = await Order.findOne({ _id: orderId }).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Transform items to desired format
    order.items = await Promise.all(order.items.map(async(item) => {
      const product = await Product.findById(item.productID)
      return {
        title: product.title,
        image: product.images[0],
        quantity: item.quantity,
        price: item.price
      }
    }))

    res.status(200).json({status: "success", message: "order details fetched successfully", order});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "failed",
      message: "Something went wrong on server"
    });
  }
};