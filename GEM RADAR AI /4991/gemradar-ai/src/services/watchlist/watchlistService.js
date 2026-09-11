import Watchlist from "@/models/Watchlist";
import WatchlistItem from "@/models/WatchlistItem";
import Token from "@/models/Token";
import TokenMetrics from "@/models/TokenMetrics";
import ScannerResult from "@/models/ScannerResult";
import { getMarketDataProvider } from "@/services/cryptoData/provider";

export async function createWatchlist(userId, name) {
  const isFirst = (await Watchlist.countDocuments({ user: userId })) === 0;
  return Watchlist.create({ user: userId, name: name || "My Watchlist", isDefault: isFirst });
}

export async function listWatchlists(userId) {
  const lists = await Watchlist.find({ user: userId }).sort({ createdAt: 1 });
  const withItems = await Promise.all(
    lists.map(async (list) => ({ ...list.toObject(), items: await getEnrichedItems(list._id) }))
  );
  return withItems;
}

export async function renameWatchlist(userId, listId, name) {
  const list = await Watchlist.findOneAndUpdate({ _id: listId, user: userId }, { name }, { new: true });
  if (!list) throw new Error("Watchlist not found");
  return list;
}

export async function deleteWatchlist(userId, listId) {
  const list = await Watchlist.findOneAndDelete({ _id: listId, user: userId });
  if (!list) throw new Error("Watchlist not found");
  await WatchlistItem.deleteMany({ watchlist: listId });
  return list;
}

export async function addTokenToWatchlist(userId, listId, { symbol, address, blockchain }) {
  const list = await Watchlist.findOne({ _id: listId, user: userId });
  if (!list) throw new Error("Watchlist not found");

  let token = address
    ? await Token.findOne({ address, blockchain })
    : await Token.findOne({ symbol: symbol?.toUpperCase(), blockchain });

  if (!token) {
    token = await Token.create({
      address: address || `unresolved-${symbol}-${Date.now()}`,
      symbol: (symbol || "UNKNOWN").toUpperCase(),
      blockchain: blockchain || "Unknown"
    });
  }

  const existing = await WatchlistItem.findOne({ watchlist: listId, token: token._id });
  if (existing) throw new Error("Token is already in this watchlist");

  const count = await WatchlistItem.countDocuments({ watchlist: listId });
  return WatchlistItem.create({ watchlist: listId, token: token._id, sortOrder: count });
}

export async function removeTokenFromWatchlist(userId, listId, itemId) {
  const list = await Watchlist.findOne({ _id: listId, user: userId });
  if (!list) throw new Error("Watchlist not found");
  const item = await WatchlistItem.findOneAndDelete({ _id: itemId, watchlist: listId });
  if (!item) throw new Error("Item not found");
  return item;
}

export async function reorderWatchlistItems(userId, listId, orderedItemIds) {
  const list = await Watchlist.findOne({ _id: listId, user: userId });
  if (!list) throw new Error("Watchlist not found");
  await Promise.all(
    orderedItemIds.map((itemId, index) =>
      WatchlistItem.updateOne({ _id: itemId, watchlist: listId }, { sortOrder: index })
    )
  );
  return getEnrichedItems(listId);
}

async function getEnrichedItems(listId) {
  const items = await WatchlistItem.find({ watchlist: listId }).sort({ sortOrder: 1 }).populate("token");

  return Promise.all(
    items.map(async (item) => {
      const token = item.token;
      if (!token) return { _id: item._id, token: null };

      const metrics = await TokenMetrics.findOne({ token: token._id }).sort({ fetchedAt: -1 });
      const scannerResult = await ScannerResult.findOne({ token: token._id }).sort({ scannedAt: -1 });

      let livePrice = null;
      try {
        const price = await getMarketDataProvider().getTokenPrice(token.symbol.toLowerCase());
        livePrice = price?.usd ?? null;
      } catch {
        livePrice = null;
      }

      return {
        _id: item._id,
        sortOrder: item.sortOrder,
        token: { id: token._id, symbol: token.symbol, name: token.name, address: token.address, blockchain: token.blockchain },
        price: livePrice ?? metrics?.price ?? null,
        priceChange24h: metrics?.priceChange24h ?? null,
        volume24h: metrics?.volume24h ?? null,
        marketCap: metrics?.marketCap ?? null,
        opportunityScore: scannerResult?.opportunityScore ?? null,
        riskScore: scannerResult?.riskScore ?? null,
        riskLevel: scannerResult?.riskLevel ?? null
      };
    })
  );
}
