import Alert from "@/models/Alert";
import Token from "@/models/Token";

export async function createAlert(userId, body) {
  const { type, tokenSymbol, blockchain, metric, operator, value, channels, cooldownMinutes } = body;
  if (!type || !metric || !operator || value === undefined) {
    throw new Error("Alert type, metric, operator and value are required");
  }

  let token = null;
  if (tokenSymbol) {
    token = await Token.findOne({ symbol: tokenSymbol.toUpperCase(), ...(blockchain ? { blockchain } : {}) });
    if (!token) {
      token = await Token.create({
        address: `unresolved-${tokenSymbol}-${Date.now()}`,
        symbol: tokenSymbol.toUpperCase(),
        blockchain: blockchain || "Unknown"
      });
    }
  }

  return Alert.create({
    user: userId,
    type,
    token: token?._id,
    tokenSymbol: tokenSymbol?.toUpperCase(),
    condition: { metric, operator, value },
    channels: channels?.length ? channels : ["in_app"],
    cooldownMinutes: cooldownMinutes || 60
  });
}

export async function listAlerts(userId) {
  return Alert.find({ user: userId }).sort({ createdAt: -1 }).populate("token", "symbol blockchain");
}

export async function updateAlert(userId, alertId, updates) {
  const allowed = ["isActive", "condition", "channels", "cooldownMinutes"];
  const patch = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  const alert = await Alert.findOneAndUpdate({ _id: alertId, user: userId }, patch, { new: true });
  if (!alert) throw new Error("Alert not found");
  return alert;
}

export async function deleteAlert(userId, alertId) {
  const alert = await Alert.findOneAndDelete({ _id: alertId, user: userId });
  if (!alert) throw new Error("Alert not found");
  return alert;
}
