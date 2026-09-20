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
              `You are a marketing compliance reviewer for ClearPath Financial. Your job is to check affiliate ads for consumer lending products (personal loans, credit cards, mortgage prequalification). The ad is for product "${product}". ` +
              `Review the provided ad image against these rules: ` +
              `1. No False Guarantees: The ad must not promise approval (e.g., banned phrases: "guaranteed approval", "100% approved", "no risk", "instant cash with no checks"). ` +
              `2. Accurate Pricing & Terms: If any interest rate, fee, or monthly payment is mentioned, the text must state that terms vary or include "terms apply" and the APR range. ` +
              `3. Required Disclosures: The ad must mention the company name "ClearPath Financial" and clearly state that products depend on credit review or approval. ` +
              `4. Clear Language: The terms must not be misleading or hidden. ` +
              `Return JSON only: { "overall": "pass"|"fail", "issues": string[], "recommended_changes": string, "ocr_text": string }. ` +
              `Set overall to "fail" if any violation exists, else "pass". List every violation in issues, or ["None"]. Give specific edits in recommended_changes, or "None". Transcribe visible ad text into ocr_text.`,
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
    if (!parsed || !["pass", "fail"].includes(parsed.overall)) {
      return fallback(model);
    }

    const issues = Array.isArray(parsed.issues) ? parsed.issues.map(String) : [];
    const recommended =
      typeof parsed.recommended_changes === "string"
        ? parsed.recommended_changes
        : "None";

    return {
      checks: [],
      notes: [
        `Status: ${parsed.overall === "pass" ? "PASS" : "FAIL"}`,
        `Issues Found: ${issues.length ? issues.join(" | ") : "None"}`,
        `Recommended Changes: ${recommended}`,
      ],
      overall: parsed.overall,
      findings: issues.map((message: string) => ({
        code: "rule_violation",
        severity: "fail" as const,
        message,
      })),
      issues,
      recommended_changes: recommended,
      ocr_text: typeof parsed.ocr_text === "string" ? parsed.ocr_text : "",
      model,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    console.error("AI check error:", e);
    return fallback(model);
  }
}