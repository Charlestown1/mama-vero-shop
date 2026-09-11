import mongoose from "mongoose";

const PortfolioHoldingSchema = new mongoose.Schema(
  {
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio", required: true, index: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token" },
    symbol: String,
    quantity: { type: Number, required: true },
    avgBuyPrice: Number
  },
  { timestamps: true }
);

export default mongoose.models.PortfolioHolding || mongoose.model("PortfolioHolding", PortfolioHoldingSchema);
