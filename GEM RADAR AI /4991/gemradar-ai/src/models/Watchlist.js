import mongoose from "mongoose";

const WatchlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, default: "My Watchlist" },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Watchlist || mongoose.model("Watchlist", WatchlistSchema);
