import Stripe from "stripe";
import { Order } from "../models/order.model.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).json({status: "failed", message:err.message});
  }

  // ✅ Handle supported event types
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const { orderId } = paymentIntent.metadata;
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        paidAt: paymentIntent.paidAt,
        stripePaymentId: paymentIntent.id
      }, {new: true})
      break;
    }

  res.status(200).json({ received: true });
};
