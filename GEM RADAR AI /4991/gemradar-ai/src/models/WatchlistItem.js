import mongoose from "mongoose";

const WatchlistItemSchema = new mongoose.Schema(
  {
    watchlist: { type: mongoose.Schema.Types.ObjectId, ref: "Watchlist", required: true, index: true },
    token: { type: mongoose.Schema.Types.ObjectId, ref: "Token", required: true },
    sortOrder: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.WatchlistItem || mongoose.model("WatchlistItem", WatchlistItemSchema);
