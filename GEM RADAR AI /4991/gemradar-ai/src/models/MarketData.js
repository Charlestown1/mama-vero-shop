import mongoose from "mongoose";

const MarketDataSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    price: Number,
    change24h: Number,
    volume24h: Number,
    marketCap: Number,
    dominance: Number,
    fetchedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.MarketData || mongoose.model("MarketData", MarketDataSchema);
