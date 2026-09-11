import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    address: { type: String, required: true },
    blockchain: { type: String, required: true },
    label: String,
    isTracked: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);
