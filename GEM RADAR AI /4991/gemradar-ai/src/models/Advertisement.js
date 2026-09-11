import mongoose from "mongoose";

const AdvertisementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    advertiserName: String,
    imageUrl: { type: String, required: true },
    destinationUrl: { type: String, required: true },
    description: String,
    ctaText: { type: String, default: "Learn More" },
    startDate: Date,
    endDate: Date,
    placement: {
      type: String,
      enum: ["homepage", "dashboard", "scanner", "research_page", "token_page", "sidebar", "top_banner", "bottom_banner"],
      required: true
    },
    status: { type: String, enum: ["active", "paused", "expired"], default: "active" },
    priority: { type: Number, default: 0 },
    maxImpressions: Number,
    maxClicks: Number,
    targetSubscriptionLevel: { type: String, enum: ["all", "free", "pro", "pro_plus"], default: "all" }
  },
  { timestamps: true }
);

export default mongoose.models.Advertisement || mongoose.model("Advertisement", AdvertisementSchema);
