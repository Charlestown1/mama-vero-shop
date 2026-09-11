import axios from "axios";
import { geminiConfig, isGeminiConfigured } from "@/config/gemini";
import logger from "@/lib/logger/logger";

const GEMINI_TIMEOUT_MS = 20_000; // AI generation is slower than a normal API call, but must not hang a request forever

async function callGemini(prompt) {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env to enable AI features.");
  }
  const url = `${geminiConfig.endpoint}/${geminiConfig.model}:generateContent?key=${geminiConfig.apiKey}`;
  let response;
  try {
    response = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] }, { timeout: GEMINI_TIMEOUT_MS });
  } catch (err) {
    // Never let a raw axios/network error (which could include the request URL
    // with the API key as a query param) bubble up to a caller/log line that
    // might surface it to the client.
    const status = err.response?.status;
    logger.error(`Gemini request failed${status ? ` (status ${status})` : ""}: ${err.code || err.message}`);
    if (err.code === "ECONNABORTED") throw new Error("The AI service timed out. Please try again.");
    throw new Error("The AI service is temporarily unavailable. Please try again.");
  }
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function buildFactualGuard(dataJson) {
  return `You are a crypto research analyst. Use ONLY the factual data provided below.
If a data point is missing, explicitly write "Data unavailable" for it — never invent numbers.
Clearly separate FACTS (from the provided data) from AI INTERPRETATION (your analysis).

DATA:
${JSON.stringify(dataJson, null, 2)}
`;
}

export async function generateTokenResearch(tokenData) {
  const prompt = buildFactualGuard(tokenData) + `
Produce a structured JSON research report with keys:
overview, marketData, priceStructure, volumeAnalysis, liquidityAnalysis, holderAnalysis,
whaleActivity, socialSentiment, tokenomics, contractSecurity, bullCase, bearCase, catalysts,
risks, aiOpportunityScore (0-100), aiRiskScore (0-100), classification
(STRONG_OPPORTUNITY | WATCH | NEUTRAL | HIGH_RISK | AVOID).
Return JSON only, no prose outside the JSON object.`;
  try {
    const raw = await callGemini(prompt);
    return { raw, parsed: safeJsonParse(raw) };
  } catch (err) {
    logger.error(`generateTokenResearch failed: ${err.message}`);
    throw err;
  }
}

export async function analyzePortfolio(portfolioData) {
  const prompt = buildFactualGuard(portfolioData) + `
Analyze allocation, concentration, and market correlation based only on this data.
Do not provide guaranteed predictions. Return JSON with keys:
allocationSummary, concentrationRisk, correlationNote, observations (array of strings).`;
  const raw = await callGemini(prompt);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function explainGemScore(scoreBreakdown) {
  const prompt = buildFactualGuard(scoreBreakdown) + `
Explain in plain language why this token received this Opportunity Score, citing only
the supplied breakdown values. Return JSON with keys: positiveSignals (array), negativeSignals (array), summary (string).`;
  const raw = await callGemini(prompt);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function summarizeMarket(marketSnapshot) {
  const prompt = buildFactualGuard(marketSnapshot) + `
Summarize overall market conditions using only this data. Return JSON with keys:
sentiment (string), summary (string), keyMovers (array).`;
  const raw = await callGemini(prompt);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function generateRiskExplanation(riskData) {
  const prompt = buildFactualGuard(riskData) + `
Explain the security/risk score using only supplied data. Return JSON with keys:
riskLevel (LOW|MEDIUM|HIGH|CRITICAL), reasons (array of strings), summary (string).`;
  const raw = await callGemini(prompt);
  return { raw, parsed: safeJsonParse(raw) };
}

function safeJsonParse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
