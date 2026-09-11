import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, default: "My Portfolio" }
  },
  { timestamps: true }
);

export default mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);
