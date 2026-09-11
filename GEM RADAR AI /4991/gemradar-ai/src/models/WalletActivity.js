import mongoose from "mongoose";

const WalletActivitySchema = new mongoose.Schema(
  {
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token" },
    txHash: String,
    type: { type: String, enum: ["buy", "sell", "transfer_in", "transfer_out"] },
    amountUsd: Number,
    occurredAt: Date
  },
  { timestamps: true }
);

export default mongoose.models.WalletActivity || mongoose.model("WalletActivity", WalletActivitySchema);
