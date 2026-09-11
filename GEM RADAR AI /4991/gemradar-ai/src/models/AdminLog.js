import mongoose from "mongoose";

const AdminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: String,
    targetId: String,
    details: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.models.AdminLog || mongoose.model("AdminLog", AdminLogSchema);
