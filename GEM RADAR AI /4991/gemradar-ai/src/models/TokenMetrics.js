import mongoose from "mongoose";

const TokenMetricsSchema = new mongoose.Schema(
  {
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token", required: true, index: true },
    price: Number,
    marketCap: Number,
    liquidity: Number,
    volume24h: Number,
    volumeChangePct: Number,
    holderCount: Number,
    holderGrowthPct: Number,
    priceChange24h: Number,
    tokenAgeHours: Number,
    whaleActivityLevel: { type: String, enum: ["BULLISH", "NEUTRAL", "BEARISH"] },
    socialMomentumScore: Number,
    fetchedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.TokenMetrics || mongoose.model("TokenMetrics", TokenMetricsSchema);
