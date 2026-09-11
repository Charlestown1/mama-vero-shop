import mongoose from "mongoose";

const ResearchReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token" },
    tokenSnapshot: { symbol: String, name: String, address: String, blockchain: String },
    aiOpportunityScore: Number,
    aiRiskScore: Number,
    classification: { type: String, enum: ["STRONG_OPPORTUNITY", "WATCH", "NEUTRAL", "HIGH_RISK", "AVOID"] },
    reportContent: { type: mongoose.Schema.Types.Mixed },
    rawGeminiResponse: String,
    dataCompleteness: { type: mongoose.Schema.Types.Mixed },
    isValidated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Every history-panel and admin-history query filters by user and sorts by
// createdAt — a compound index serves that pattern directly instead of
// relying on the single-field `user` index plus an in-memory sort.
ResearchReportSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.ResearchReport || mongoose.model("ResearchReport", ResearchReportSchema);
