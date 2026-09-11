import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["price", "price_pct", "volume", "whale", "score", "risk_score", "holder_growth", "wallet_activity", "custom"], required: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token" },
    tokenSymbol: String,
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
    condition: {
      metric: String,
      operator: { type: String, enum: ["gt", "lt", "gte", "lte", "eq"] },
      value: Number
    },
    channels: [{ type: String, enum: ["email", "telegram", "in_app", "push"] }],
    isActive: { type: Boolean, default: true, index: true },
    lastTriggeredAt: Date,
    triggerCount: { type: Number, default: 0 },
    cooldownMinutes: { type: Number, default: 60 }
  },
  { timestamps: true }
);

export default mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
