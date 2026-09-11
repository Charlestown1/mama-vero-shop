import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    image: String,
    authProvider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    googleId: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    subscriptionTier: { type: String, enum: ["free", "pro", "pro_plus"], default: "free" },
    subscriptionStatus: { type: String, enum: ["active", "canceled", "past_due", "none"], default: "none" },
    stripeCustomerId: String,
    isSuspended: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: Date,
    telegramChatId: String,
    telegramLinkCode: String,
    notificationPreferences: {
      email: { type: Boolean, default: true },
      telegram: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
