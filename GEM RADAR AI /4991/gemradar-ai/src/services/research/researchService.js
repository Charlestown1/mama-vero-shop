import { getMarketDataProvider, getLiquidityProvider, getOnchainProvider } from "@/services/cryptoData/provider";
import { isOnchainProviderConfigured } from "@/services/cryptoData/onchainProvider";
import { generateTokenResearch } from "@/services/ai/geminiService";

const REQUIRED_KEYS = [
  "overview", "marketData", "priceStructure", "volumeAnalysis", "liquidityAnalysis",
  "holderAnalysis", "whaleActivity", "socialSentiment", "tokenomics", "contractSecurity",
  "bullCase", "bearCase", "catalysts", "risks", "aiOpportunityScore", "aiRiskScore", "classification"
];
const VALID_CLASSIFICATIONS = ["STRONG_OPPORTUNITY", "WATCH", "NEUTRAL", "HIGH_RISK", "AVOID"];

// Gathers only real data from connected providers. Any field a provider can't supply
// is left as null / "unavailable" — never guessed — so Gemini's prompt guard (see
// geminiService.buildFactualGuard) can honestly report it as unavailable too.
export async function gatherTokenData({ symbol, address, blockchain }) {
  const dataCompleteness = { marketData: false, liquidityData: false, onchainData: false };
  const data = {
    overview: { symbol: symbol || null, address: address || null, blockchain: blockchain || null },
    marketData: null,
    liquidity: null,
    holderData: null,
    contractSecurity: null
  };

  // Market data (price / 24h change) — CoinGecko, keyed by symbol/id when we have one
  if (symbol) {
    try {
      const priceData = await getMarketDataProvider().getTokenPrice(symbol.toLowerCase());
      if (priceData) {
        data.marketData = {
          priceUsd: priceData.usd ?? null,
          priceChange24hPct: priceData.usd_24h_change ?? null
        };
        dataCompleteness.marketData = true;
      }
    } catch {
      data.marketData = "unavailable";
    }
  } else {
    data.marketData = "unavailable — no symbol provided";
  }

  // Liquidity / pair data — Dexscreener, keyed by contract address
  if (address) {
    try {
      const pairs = await getLiquidityProvider().getTokenPairData(address);
      const top = pairs?.[0];
      if (top) {
        data.liquidity = {
          liquidityUsd: top.liquidity?.usd ?? null,
          fdv: top.fdv ?? null,
          volume24hUsd: top.volume?.h24 ?? null,
          priceChange24hPct: top.priceChange?.h24 ?? null,
          pairCreatedAt: top.pairCreatedAt ?? null,
          dexId: top.dexId ?? null
        };
        dataCompleteness.liquidityData = true;
      } else {
        data.liquidity = "unavailable — no matching trading pair found";
      }
    } catch {
      data.liquidity = "unavailable — liquidity provider request failed";
    }
  } else {
    data.liquidity = "unavailable — no contract address provided";
  }

  // On-chain holder + security data — requires a configured paid provider
  if (address && isOnchainProviderConfigured()) {
    try {
      data.holderData = (await getOnchainProvider().getHolderData(address, blockchain)) || "unavailable";
      data.contractSecurity = (await getOnchainProvider().getContractSecurity(address, blockchain)) || "unavailable";
      dataCompleteness.onchainData = data.holderData !== "unavailable";
    } catch {
      data.holderData = "unavailable — on-chain provider request failed";
      data.contractSecurity = "unavailable — on-chain provider request failed";
    }
  } else {
    data.holderData = "unavailable — no on-chain data provider configured (set ONCHAIN_API_KEY)";
    data.contractSecurity = "unavailable — no on-chain data provider configured (set ONCHAIN_API_KEY)";
  }

  return { data, dataCompleteness };
}

function validateReportShape(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  const hasAllKeys = REQUIRED_KEYS.every((k) => k in parsed);
  const validClassification = VALID_CLASSIFICATIONS.includes(parsed.classification);
  const validScores =
    typeof parsed.aiOpportunityScore === "number" &&
    typeof parsed.aiRiskScore === "number" &&
    parsed.aiOpportunityScore >= 0 && parsed.aiOpportunityScore <= 100 &&
    parsed.aiRiskScore >= 0 && parsed.aiRiskScore <= 100;
  return hasAllKeys && validClassification && validScores;
}

// Orchestrates: gather real data -> Gemini analysis -> validate shape before it's
// ever saved or rendered. Throws on failure rather than returning a guessed report.
export async function runResearch({ symbol, address, blockchain }) {
  const { data, dataCompleteness } = await gatherTokenData({ symbol, address, blockchain });

  const { raw, parsed } = await generateTokenResearch(data);

  if (!validateReportShape(parsed)) {
    const err = new Error(
      "The AI response could not be validated against the required report structure. This can happen if Gemini returned malformed JSON. Please try again."
    );
    err.code = "INVALID_AI_RESPONSE";
    err.rawGeminiResponse = raw;
    throw err;
  }

  return {
    tokenSnapshot: { symbol: symbol || null, name: null, address: address || null, blockchain: blockchain || null },
    aiOpportunityScore: parsed.aiOpportunityScore,
    aiRiskScore: parsed.aiRiskScore,
    classification: parsed.classification,
    reportContent: parsed,
    rawGeminiResponse: raw,
    dataCompleteness,
    isValidated: true
  };
}
