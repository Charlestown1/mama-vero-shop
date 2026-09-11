import Advertisement from "@/models/Advertisement";
import AdvertisementImpression from "@/models/AdvertisementImpression";
import AdvertisementClick from "@/models/AdvertisementClick";

const SAFE_URL_SCHEMES = ["http:", "https:"];

function assertSafeUrl(url, label) {
  try {
    const parsed = new URL(url);
    if (!SAFE_URL_SCHEMES.includes(parsed.protocol)) {
      throw new Error(`${label} must use http or https`);
    }
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
}

export async function createAdvertisement(body) {
  const { title, advertiserName, imageUrl, destinationUrl, description, ctaText, startDate, endDate, placement, priority, maxImpressions, maxClicks, targetSubscriptionLevel } = body;
  if (!title || !imageUrl || !destinationUrl || !placement) {
    throw new Error("Title, image URL, destination URL and placement are required");
  }
  assertSafeUrl(imageUrl, "Image URL");
  assertSafeUrl(destinationUrl, "Destination URL");

  return Advertisement.create({
    title, advertiserName, imageUrl, destinationUrl, description,
    ctaText: ctaText || "Learn More",
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    placement,
    status: "active",
    priority: priority || 0,
    maxImpressions: maxImpressions || undefined,
    maxClicks: maxClicks || undefined,
    targetSubscriptionLevel: targetSubscriptionLevel || "all"
  });
}

export async function updateAdvertisement(id, body) {
  const allowed = ["title", "advertiserName", "imageUrl", "destinationUrl", "description", "ctaText", "startDate", "endDate", "placement", "status", "priority", "maxImpressions", "maxClicks", "targetSubscriptionLevel"];
  const patch = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (["startDate", "endDate"].includes(key)) patch[key] = body[key] ? new Date(body[key]) : null;
    else patch[key] = body[key];
  }
  if (patch.imageUrl) assertSafeUrl(patch.imageUrl, "Image URL");
  if (patch.destinationUrl) assertSafeUrl(patch.destinationUrl, "Destination URL");

  const ad = await Advertisement.findByIdAndUpdate(id, patch, { new: true });
  if (!ad) throw new Error("Advertisement not found");
  return ad;
}

export async function deleteAdvertisement(id) {
  const ad = await Advertisement.findByIdAndDelete(id);
  if (!ad) throw new Error("Advertisement not found");
  return ad;
}

function rangeStart(rangeKey) {
  const days = { today: 1, "7d": 7, "30d": 30, all: null }[rangeKey] ?? null;
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function listAdvertisementsWithAnalytics(rangeKey = "all") {
  const ads = await Advertisement.find({}).sort({ createdAt: -1 });
  const since = rangeStart(rangeKey);
  const dateFilter = since ? { occurredAt: { $gte: since } } : {};

  return Promise.all(
    ads.map(async (ad) => {
      const [impressions, clicks] = await Promise.all([
        AdvertisementImpression.countDocuments({ advertisement: ad._id, ...dateFilter }),
        AdvertisementClick.countDocuments({ advertisement: ad._id, ...dateFilter })
      ]);
      const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;

      const now = new Date();
      let lifecycleStatus = ad.status;
      if (ad.status === "active") {
        if (ad.endDate && ad.endDate < now) lifecycleStatus = "expired";
        else if (ad.startDate && ad.startDate > now) lifecycleStatus = "scheduled";
      }

      return { ...ad.toObject(), impressions, clicks, ctr, lifecycleStatus };
    })
  );
}
