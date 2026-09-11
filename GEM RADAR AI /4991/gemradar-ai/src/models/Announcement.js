import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    ctaText: String,
    ctaUrl: String,
    placement: {
      type: String,
      enum: ["homepage", "dashboard", "scanner", "research", "token_page", "global_banner"],
      default: "global_banner"
    },
    priority: { type: Number, default: 0 },
    targetPlan: { type: String, enum: ["all", "free", "pro", "pro_plus"], default: "all" },
    startDate: Date,
    visibility: { type: String, enum: ["global", "dashboard_only"], default: "global" },
    showOnce: { type: Boolean, default: false },
    activeUntil: Date,
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
