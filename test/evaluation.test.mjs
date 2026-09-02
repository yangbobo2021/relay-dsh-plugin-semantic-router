import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { evaluateSemanticRouter } from "../src/evaluation.mjs";

test("EP14-009: sanitized fixed regression set meets declared routing quality gates", async () => {
  const fixtures = JSON.parse(await readFile(new URL("../fixtures/quality-set.json", import.meta.url), "utf8"));
  const report = await evaluateSemanticRouter(fixtures);
  assert.equal(report.passed, true);
  assert.deepEqual(report.metrics, {
    fixture_count: 5,
    actionable_coverage: 1,
    target_recall: 1,
    exclusive_misroutes: 0,
    unnecessary_escalations: 0,
    duplicate_targets: 0,
    p95_latency_ms: 10,
    max_total_tokens: 130,
  });
  assert.ok(report.rows.every(row => /^[a-f0-9]{64}$/u.test(row.candidate_fingerprint)));
});
