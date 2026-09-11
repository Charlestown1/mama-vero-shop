import mongoose from "mongoose";

const AdvertisementImpressionSchema = new mongoose.Schema(
  {
    advertisement: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    occurredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Serves both the impression-dedup lookup (advertisement + user + recent
// occurredAt) and per-campaign analytics range queries (advertisement + occurredAt).
AdvertisementImpressionSchema.index({ advertisement: 1, occurredAt: -1 });

export default mongoose.models.AdvertisementImpression || mongoose.model("AdvertisementImpression", AdvertisementImpressionSchema);
