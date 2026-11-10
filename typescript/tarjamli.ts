import { readFileSync } from "node:fs";
export const LANGUAGES: Record<string, string> = JSON.parse(readFileSync(new URL("../languages.json", import.meta.url), "utf8"));
export type TranslationRequest = { model: "tarjamli-mini-v4"; text: string; source: string; target: string; instructions?: string };
export type TranslationResponse = { data: { translated: string; complete: boolean; source: string; target: string; model: string }; usage?: Record<string, unknown> };
export function makeRequest(text: string, source: string, target: string, instructions = ""): TranslationRequest {
  if (typeof text !== "string" || !text.trim()) throw new Error("text must be nonempty");
  if (Buffer.byteLength(text, "utf8") > 262144) throw new Error("text exceeds 262144 UTF-8 bytes");
  if (!Object.hasOwn(LANGUAGES, source) || !Object.hasOwn(LANGUAGES, target)) throw new Error("Use explicit supported language codes from languages.json");
  if (typeof instructions !== "string" || Buffer.byteLength(instructions, "utf8") > 32768) throw new Error("instructions must be a string of at most 32768 UTF-8 bytes");
  return { model: "tarjamli-mini-v4", text, source, target, ...(instructions.trim() ? { instructions } : {}) };
}
export async function translate(text: string, source: string, target: string, instructions = "", apiKey = process.env.SAWALNI_API_KEY): Promise<TranslationResponse> {
  const payload = makeRequest(text, source, target, instructions);
  if (!apiKey) throw new Error("Set SAWALNI_API_KEY in your shell");
  let response: Response;
  try {
    response = await fetch("https://api.sawalni.com/v1/language/translate", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "Sawalni-Tarjamli-Starter/1.0" },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(180000)
    });
  } catch { throw new Error("Translation connection failed or timed out. Check before retrying; the request may have run."); }
  if (!response.ok) throw new Error(`Translation HTTP ${response.status}; check access, input and API status. No automatic retry.`);
  let body: TranslationResponse;
  try { body = await response.json() as TranslationResponse; } catch { throw new Error("API returned invalid JSON"); }
  const data = body?.data;
  if (!data || typeof data.translated !== "string" || !data.translated.trim()) throw new Error("API returned no translation");
  if (data.complete !== true) throw new Error("Translation is incomplete; shorten the input before trying again");
  if (data.source !== source || data.target !== target || data.model !== payload.model) throw new Error("Unexpected response model or language identity");
  return body;
}
