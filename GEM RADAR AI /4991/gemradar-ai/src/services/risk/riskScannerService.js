import { getLiquidityProvider, getOnchainProvider } from "@/services/cryptoData/provider";
import { isOnchainProviderConfigured } from "@/services/cryptoData/onchainProvider";
import { calculateRiskScore, DEFAULT_RISK_WEIGHTS } from "@/services/scanner/scoringEngine";
import SystemSetting from "@/models/SystemSetting";

export async function getActiveRiskWeights() {
  const setting = await SystemSetting.findOne({ key: "risk_weights" });
  return setting?.value || DEFAULT_RISK_WEIGHTS;
}

const FIELD_LABELS = {
  buyTax: "Buy tax",
  sellTax: "Sell tax",
  mintAuthorityActive: "Mint authority status",
  freezeAuthorityActive: "Freeze authority status",
  isHoneypot: "Honeypot check",
  liquidityLocked: "Liquidity lock status",
  top10HolderPct: "Top 10 holder concentration",
  contractVerified: "Contract verification status"
};

// Combines whatever real signals the connected providers can supply. Fields no
// provider currently returns are reported as "unavailable" — never guessed —
// and are excluded from both the positive and negative factor lists.
export async function assessTokenRisk(address, blockchain) {
  if (!address) throw new Error("A contract address is required to run the Risk Scanner");

  let liquidityUsd = null;
  try {
    const pairs = await getLiquidityProvider().getTokenPairData(address);
    liquidityUsd = pairs?.[0]?.liquidity?.usd ?? null;
  } catch {
    liquidityUsd = null;
  }

  let onchainSecurity = {};
  let onchainAvailable = false;
  if (isOnchainProviderConfigured()) {
    try {
      const result = await getOnchainProvider().getContractSecurity(address, blockchain);
      if (result) {
        onchainSecurity = result;
        onchainAvailable = true;
      }
    } catch {
      onchainAvailable = false;
    }
  }

  // Liquidity is the one security-relevant signal we can assess without a paid provider.
  const security = { ...onchainSecurity };
  const liquidityKnown = liquidityUsd !== null;
  const lowLiquidity = liquidityKnown && liquidityUsd < 10000;

  const { score, level, reasons } = calculateRiskScore(security, await getActiveRiskWeights());
  if (lowLiquidity) reasons.push(`Liquidity is very low ($${Math.round(liquidityUsd).toLocaleString()})`);

  const unavailableFactors = Object.entries(FIELD_LABELS)
    .filter(([key]) => security[key] === undefined)
    .map(([, label]) => label);

  const positiveFactors = [];
  if (security.contractVerified) positiveFactors.push("Contract is verified");
  if (security.liquidityLocked) positiveFactors.push("Liquidity is locked");
  if (liquidityKnown && !lowLiquidity) positiveFactors.push(`Liquidity is healthy ($${Math.round(liquidityUsd).toLocaleString()})`);

  return {
    score: lowLiquidity ? Math.max(0, score - 15) : score,
    level,
    reasons,
    positiveFactors,
    unavailableFactors,
    liquidityUsd,
    dataComplete: onchainAvailable,
    onchainProviderConfigured: isOnchainProviderConfigured()
  };
}
