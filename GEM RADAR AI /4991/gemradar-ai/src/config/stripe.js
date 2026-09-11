import Stripe from "stripe";

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  priceIds: {
    pro: process.env.STRIPE_PRO_PRICE_ID || "",
    pro_plus: process.env.STRIPE_PRO_PLUS_PRICE_ID || ""
  }
};

export function isStripeConfigured() {
  return Boolean(stripeConfig.secretKey);
}

export function getStripeClient() {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env");
  }
  return new Stripe(stripeConfig.secretKey, { apiVersion: "2024-06-20" });
}
