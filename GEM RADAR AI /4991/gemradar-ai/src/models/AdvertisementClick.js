import mongoose from "mongoose";

const AdvertisementClickSchema = new mongoose.Schema(
  {
    advertisement: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    occurredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AdvertisementClickSchema.index({ advertisement: 1, occurredAt: -1 }); // per-campaign CTR analytics range queries

export default mongoose.models.AdvertisementClick || mongoose.model("AdvertisementClick", AdvertisementClickSchema);
