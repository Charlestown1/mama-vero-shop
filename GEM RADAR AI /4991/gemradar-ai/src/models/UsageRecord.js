import mongoose from "mongoose";

const UsageRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    feature: { type: String, enum: ["scan", "ai_research", "alert", "watchlist"], required: true },
    count: { type: Number, default: 0 },
    periodStart: Date,
    periodEnd: Date
  },
  { timestamps: true }
);
UsageRecordSchema.index({ user: 1, feature: 1, periodStart: 1 }, { unique: true });

export default mongoose.models.UsageRecord || mongoose.model("UsageRecord", UsageRecordSchema);
