import Stripe from "stripe";
import { Order } from "../models/order.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: 'pkr',
    metadata: {
      orderId
    },
  });

  res.json({ status: 'success', clientSecret: paymentIntent.client_secret });
};