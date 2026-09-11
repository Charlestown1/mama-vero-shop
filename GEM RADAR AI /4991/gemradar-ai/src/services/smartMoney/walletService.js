import Wallet from "@/models/Wallet";
import WalletActivity from "@/models/WalletActivity";
import Token from "@/models/Token";

export async function addWallet(userId, { address, blockchain, label }) {
  if (!address || !blockchain) throw new Error("Wallet address and blockchain are required");
  const existing = await Wallet.findOne({ user: userId, address, blockchain });
  if (existing) throw new Error("You're already tracking this wallet");
  return Wallet.create({ user: userId, address, blockchain, label, isTracked: true });
}

export async function listWallets(userId) {
  return Wallet.find({ user: userId }).sort({ createdAt: -1 });
}

export async function toggleWallet(userId, walletId, isTracked) {
  const wallet = await Wallet.findOneAndUpdate(
    { _id: walletId, user: userId },
    { isTracked },
    { new: true }
  );
  if (!wallet) throw new Error("Wallet not found");
  return wallet;
}

export async function removeWallet(userId, walletId) {
  const wallet = await Wallet.findOneAndDelete({ _id: walletId, user: userId });
  if (!wallet) throw new Error("Wallet not found");
  return wallet;
}

// Reads whatever activity already exists in the database for this wallet.
// Nothing here fabricates transactions: on-chain transaction history requires a
// provider that streams/indexes wallet activity (e.g. Moralis streams, a
// blockchain node, or a paid whale-tracking API) — that ingestion job is the
// natural next piece to wire once ONCHAIN_API_KEY is set, and it would write
// into the WalletActivity model this function reads from.
export async function getWalletActivity(userId, walletId) {
  const wallet = await Wallet.findOne({ _id: walletId, user: userId });
  if (!wallet) throw new Error("Wallet not found");

  const activity = await WalletActivity.find({ wallet: wallet._id })
    .sort({ occurredAt: -1 })
    .limit(50)
    .populate("token", "symbol name");

  return { wallet, activity, dataSourceConnected: false };
}

// Used by the token research page to show smart-money activity for a specific
// token, where any has actually been recorded.
export async function getSmartMoneyActivityForToken(address, blockchain) {
  const token = await Token.findOne({ address, blockchain });
  if (!token) return { activity: [], dataSourceConnected: false };

  const activity = await WalletActivity.find({ token: token._id })
    .sort({ occurredAt: -1 })
    .limit(20)
    .populate("wallet", "address label");

  return { activity, dataSourceConnected: false };
}
