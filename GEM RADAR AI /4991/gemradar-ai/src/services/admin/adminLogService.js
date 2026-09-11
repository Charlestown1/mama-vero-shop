import AdminLog from "@/models/AdminLog";

// Every mutating admin action should call this. Never pass secrets/credentials
// in `details` — this is a visible audit trail, not a place to stash sensitive data.
export async function logAdminAction(adminId, action, { targetType, targetId, details } = {}) {
  return AdminLog.create({ admin: adminId, action, targetType, targetId, details });
}
