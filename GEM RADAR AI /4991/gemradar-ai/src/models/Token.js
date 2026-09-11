import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    name: String,
    blockchain: { type: String, required: true },
    decimals: Number,
    logoUrl: String,
    isFeatured: { type: Boolean, default: false },
    isBlacklisted: { type: Boolean, default: false },
    isSuspicious: { type: Boolean, default: false },
    adminNotes: String
  },
  { timestamps: true }
);
TokenSchema.index({ address: 1, blockchain: 1 }, { unique: true });

export default mongoose.models.Token || mongoose.model("Token", TokenSchema);
