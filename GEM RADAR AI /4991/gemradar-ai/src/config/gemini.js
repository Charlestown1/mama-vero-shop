export const geminiConfig = {
  apiKey: process.env.GEMINI_API_KEY || "",
  model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
  endpoint: "https://generativelanguage.googleapis.com/v1beta/models"
};

export function isGeminiConfigured() {
  return Boolean(geminiConfig.apiKey);
}
