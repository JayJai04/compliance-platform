export type AiFinding = {
  code: string;
  severity: "info" | "warn" | "fail";
  message: string;
};

export type AiResult = {
  checks: string[];
  notes: string[];
  overall?: "pass" | "warn" | "fail" | "unknown";
  findings?: AiFinding[];
  ocr_text?: string;
  model?: string;
  checked_at?: string;
};

export function fakeCheck(): AiResult {
  return {
    checks: [],
    notes: [
      "Image received. Visual check not automated in v1. Reviewer must verify APR, license, and banned claims by eye.",
    ],
  };
}
