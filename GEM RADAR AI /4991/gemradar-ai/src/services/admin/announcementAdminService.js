import Announcement from "@/models/Announcement";

// Basic HTML-escaping so admin-entered title/message can never be interpreted
// as markup when rendered — announcements are plain text + a structured CTA,
// never raw HTML/JS, by design (see also the Advertisement model, same rule).
function sanitizeText(str = "") {
  return String(str).replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
}

export async function createAnnouncement(adminId, body) {
  const { title, message, ctaText, ctaUrl, placement, priority, targetPlan, startDate, activeUntil, isActive } = body;
  if (!title || !message) throw new Error("Title and message are required");

  return Announcement.create({
    title: sanitizeText(title),
    message: sanitizeText(message),
    ctaText: ctaText ? sanitizeText(ctaText) : undefined,
    ctaUrl,
    placement: placement || "global_banner",
    priority: priority || 0,
    targetPlan: targetPlan || "all",
    startDate: startDate ? new Date(startDate) : undefined,
    activeUntil: activeUntil ? new Date(activeUntil) : undefined,
    isActive: isActive ?? true,
    createdBy: adminId
  });
}

export async function updateAnnouncement(id, body) {
  const allowed = ["title", "message", "ctaText", "ctaUrl", "placement", "priority", "targetPlan", "startDate", "activeUntil", "isActive", "showOnce"];
  const patch = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (["title", "message", "ctaText"].includes(key)) patch[key] = sanitizeText(body[key]);
    else if (["startDate", "activeUntil"].includes(key)) patch[key] = body[key] ? new Date(body[key]) : null;
    else patch[key] = body[key];
  }
  const announcement = await Announcement.findByIdAndUpdate(id, patch, { new: true });
  if (!announcement) throw new Error("Announcement not found");
  return announcement;
}

export async function deleteAnnouncement(id) {
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) throw new Error("Announcement not found");
  return announcement;
}

export async function listAllAnnouncements() {
  return Announcement.find({}).sort({ createdAt: -1 });
}

// Used by public-facing pages. Only returns announcements that are actually
// live right now for the given placement/plan — never everything in the DB.
export async function getActiveAnnouncements(placement, userPlan = "all") {
  const now = new Date();
  return Announcement.find({
    isActive: true,
    placement,
    $and: [
      { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ activeUntil: { $exists: false } }, { activeUntil: null }, { activeUntil: { $gte: now } }] },
      { $or: [{ targetPlan: "all" }, { targetPlan: userPlan }] }
    ]
  }).sort({ priority: -1 }).limit(3);
}
