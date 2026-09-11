export const DEFAULT_WEIGHTS = {
  volumeMomentum: 20,
  liquidityQuality: 15,
  holderGrowth: 15,
  whaleActivity: 15,
  priceMomentum: 10,
  socialMomentum: 10,
  marketStructure: 10,
  earlyOpportunity: 5
};

function clampPct(value, cap = 100) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(cap, value));
}

function scoreVolumeMomentum(m) { return clampPct(m.volumeChangePct || 0, 300) / 300; }
function scoreLiquidityQuality(m) { return clampPct((m.liquidity || 0) / 500000, 1); }
function scoreHolderGrowth(m) { return clampPct(m.holderGrowthPct || 0, 50) / 50; }
function scoreWhaleActivity(m) { return m.whaleActivityLevel === "BULLISH" ? 1 : m.whaleActivityLevel === "NEUTRAL" ? 0.5 : 0; }
function scorePriceMomentum(m) { return clampPct(m.priceChange24h || 0, 100) / 100; }
function scoreSocialMomentum(m) { return clampPct(m.socialMomentumScore || 0, 100) / 100; }
function scoreMarketStructure(m) { return (m.marketCap || 0) > 0 ? 1 : 0; }
function scoreEarlyOpportunity(m) {
  const ageHours = m.tokenAgeHours ?? 999999;
  return ageHours <= 24 ? 1 : ageHours <= 168 ? 0.5 : 0;
}

export function calculateOpportunityScore(metrics, weights = DEFAULT_WEIGHTS) {
  const breakdown = {
    volumeMomentum: scoreVolumeMomentum(metrics) * weights.volumeMomentum,
    liquidityQuality: scoreLiquidityQuality(metrics) * weights.liquidityQuality,
    holderGrowth: scoreHolderGrowth(metrics) * weights.holderGrowth,
    whaleActivity: scoreWhaleActivity(metrics) * weights.whaleActivity,
    priceMomentum: scorePriceMomentum(metrics) * weights.priceMomentum,
    socialMomentum: scoreSocialMomentum(metrics) * weights.socialMomentum,
    marketStructure: scoreMarketStructure(metrics) * weights.marketStructure,
    earlyOpportunity: scoreEarlyOpportunity(metrics) * weights.earlyOpportunity
  };
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score: Math.round(total), breakdown };
}

// Deterministic security/risk score (0-100, higher = safer), separate from opportunity score.
// Weights are admin-configurable (see /admin/scanner → Risk Weights) but the scoring logic
// itself stays deterministic — Gemini never touches this number.
export const DEFAULT_RISK_WEIGHTS = {
  highBuyTax: 15,
  highSellTax: 15,
  mintAuthorityActive: 20,
  freezeAuthorityActive: 15,
  honeypot: 50,
  liquidityNotLocked: 15,
  highHolderConcentration: 15,
  contractNotVerified: 10
};

export function calculateRiskScore(security = {}, weights = DEFAULT_RISK_WEIGHTS) {
  let score = 100;
  const reasons = [];

  // Only ever penalize a field the provider actually returned a definite value for.
  // A field left `undefined` (provider not configured / didn't return it) must never
  // be treated as "failed" — that would fabricate a risk signal from missing data.
  if (typeof security.buyTax === "number" && security.buyTax > 10) {
    score -= weights.highBuyTax; reasons.push(`High buy tax (${security.buyTax}%)`);
  }
  if (typeof security.sellTax === "number" && security.sellTax > 10) {
    score -= weights.highSellTax; reasons.push(`High sell tax (${security.sellTax}%)`);
  }
  if (security.mintAuthorityActive === true) {
    score -= weights.mintAuthorityActive; reasons.push("Mint authority is still active");
  }
  if (security.freezeAuthorityActive === true) {
    score -= weights.freezeAuthorityActive; reasons.push("Freeze authority is still active");
  }
  if (security.isHoneypot === true) {
    score -= weights.honeypot; reasons.push("Honeypot indicators detected");
  }
  if (security.liquidityLocked === false) {
    score -= weights.liquidityNotLocked; reasons.push("Liquidity is not locked");
  }
  if (typeof security.top10HolderPct === "number" && security.top10HolderPct > 50) {
    score -= weights.highHolderConcentration; reasons.push(`Top 10 holders control ${security.top10HolderPct}%`);
  }
  if (security.contractVerified === false) {
    score -= weights.contractNotVerified; reasons.push("Contract is not verified");
  }

  score = Math.max(0, Math.min(100, score));

  let level = "LOW";
  if (score < 40) level = "CRITICAL";
  else if (score < 60) level = "HIGH";
  else if (score < 80) level = "MEDIUM";

  return { score, level, reasons };
}
