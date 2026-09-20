import { fakeCheck, type AiResult } from "./check";

const DEFAULT_MODEL = "gpt-5.6-luna";

function fallback(model: string): AiResult {
  return { ...fakeCheck(), overall: "unknown", model };
}

export async function runAiCheck(
  imageBytes: Uint8Array,
  product: string
): Promise<AiResult> {
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback(model);

  const base64 = Buffer.from(imageBytes).toString("base64");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You are a financial-ad compliance checker. Inspect the ad image for product "${product}". ` +
              `Rules: (a) APR must be present and conspicuous if rates or terms are mentioned. ` +
              `(b) License and lender identity must be disclosed. ` +
              `(c) Flag banned claims: guaranteed approval, no credit check, instant cash guaranteed, misleading 0% forever. ` +
              `Return JSON only: { "overall": "pass"|"warn"|"fail", "findings": [{ "code": string, "severity": "info"|"warn"|"fail", "message": string }], "ocr_text": string }.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64}` },
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.error("AI check failed:", res.status);
      return fallback(model);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || !["pass", "warn", "fail"].includes(parsed.overall)) {
      return fallback(model);
    }

    return {
      checks: [],
      notes: [],
      overall: parsed.overall,
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      ocr_text: typeof parsed.ocr_text === "string" ? parsed.ocr_text : "",
      model,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    console.error("AI check error:", e);
    return fallback(model);
  }
}