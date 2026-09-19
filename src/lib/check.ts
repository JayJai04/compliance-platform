export type AiResult = {
  checks: string[];
  notes: string[];
};

export function fakeCheck(): AiResult {
  return {
    checks: [],
    notes: [
      "Image received. Visual check not automated in v1. Reviewer must verify APR, license, and banned claims by eye.",
    ],
  };
}
