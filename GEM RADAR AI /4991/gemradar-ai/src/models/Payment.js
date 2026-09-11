import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripePaymentIntentId: String,
    amount: Number,
    currency: { type: String, default: "usd" },
    status: { type: String, enum: ["succeeded", "pending", "failed", "refunded"] },
    plan: { type: String, enum: ["pro", "pro_plus"] }
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
