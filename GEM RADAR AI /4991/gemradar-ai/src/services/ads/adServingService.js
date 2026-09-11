import Advertisement from "@/models/Advertisement";
import AdvertisementImpression from "@/models/AdvertisementImpression";
import AdvertisementClick from "@/models/AdvertisementClick";

const IMPRESSION_DEDUP_WINDOW_MS = 30 * 1000; // collapse rapid re-renders into one impression
const SAFE_URL_SCHEMES = ["http:", "https:"];

// Picks the single best active ad for a placement: correct plan targeting,
// within its scheduled window, and under its impression/click caps. Never
// returns a paused/expired/exhausted campaign.
export async function getAdForPlacement(placement, userPlan, identifier) {
  const now = new Date();
  const candidates = await Advertisement.find({
    placement,
    status: "active",
    $and: [
      { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
      { $or: [{ targetSubscriptionLevel: "all" }, { targetSubscriptionLevel: userPlan }] }
    ]
  }).sort({ priority: -1 });

  for (const ad of candidates) {
    if (ad.maxImpressions) {
      const count = await AdvertisementImpression.countDocuments({ advertisement: ad._id });
      if (count >= ad.maxImpressions) continue;
    }
    if (ad.maxClicks) {
      const count = await AdvertisementClick.countDocuments({ advertisement: ad._id });
      if (count >= ad.maxClicks) continue;
    }
    return ad;
  }
  return null;
}

export async function recordImpression(adId, userId) {
  const since = new Date(Date.now() - IMPRESSION_DEDUP_WINDOW_MS);

  const recent = await AdvertisementImpression.findOne({
    advertisement: adId,
    user: userId || undefined,
    occurredAt: { $gte: since }
  });
  if (recent) return { recorded: false, reason: "deduped" }; // same viewer re-rendered within the window

  await AdvertisementImpression.create({ advertisement: adId, user: userId || undefined });
  return { recorded: true };
}

export async function recordClickAndGetUrl(adId, userId) {
  const ad = await Advertisement.findById(adId);
  if (!ad) throw new Error("Advertisement not found");

  let parsed;
  try {
    parsed = new URL(ad.destinationUrl);
  } catch {
    throw new Error("This advertisement has an invalid destination URL");
  }
  if (!SAFE_URL_SCHEMES.includes(parsed.protocol)) {
    throw new Error("This advertisement's destination URL uses an unsupported scheme");
  }

  await AdvertisementClick.create({ advertisement: adId, user: userId || undefined });
  return ad.destinationUrl;
}
