import mongoose from "mongoose";

const ScannerResultSchema = new mongoose.Schema(
  {
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token", required: true, index: true },
    opportunityScore: Number,
    breakdown: { type: mongoose.Schema.Types.Mixed },
    riskScore: Number,
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
    scannedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ScannerResultSchema.index({ scannedAt: -1 }); // admin dashboard range queries + "latest result" lookups sort on this

export default mongoose.models.ScannerResult || mongoose.model("ScannerResult", ScannerResultSchema);
