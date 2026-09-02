import assert from "node:assert/strict";

import { buildSemanticRoutingPayload, createSinglePassSemanticRouter } from "./semantic.mjs";

export async function evaluateSemanticRouter(fixtures, { latencyGateMs = 1_000, tokenGate = 2_000 } = {}) {
  assert.ok(Array.isArray(fixtures) && fixtures.length > 0, "semantic evaluation fixtures are required");
  const rows = [];
  for (const fixture of fixtures) {
    const prompts = [];
    const router = createSinglePassSemanticRouter({ maxAttempts: fixture.model_outputs.length, adapter: {
      model: "sanitized-replay/evaluation",
      async call({ prompt }) {
        prompts.push(prompt);
        const output = fixture.model_outputs[Math.min(prompts.length - 1, fixture.model_outputs.length - 1)];
        return { output, telemetry: fixture.telemetry ?? {
          model_calls: 1, latency_ms: 10, input_tokens: 100, cached_input_tokens: 0, output_tokens: 30,
        } };
      },
    } });
    const result = await router.route({ event: fixture.event, sessions: fixture.sessions });
    const decision = result.decision;
    const targetIds = decision.deliveries.map(delivery => delivery.session_id);
    const duplicateTargets = targetIds.length - new Set(targetIds).size;
    const expected = fixture.expected;
    const correctDisposition = decision.disposition === expected.disposition;
    const correctTarget = expected.session_id == null
      ? decision.deliveries.length === 0
      : decision.deliveries.length === 1 && decision.deliveries[0].session_id === expected.session_id;
    const payload = buildSemanticRoutingPayload(fixture.event, fixture.sessions);
    const labelSerialization = JSON.stringify(expected);
    assert.ok(!prompts.some(prompt => prompt.includes(labelSerialization)), `fixture ${fixture.id} leaked its evaluation label into routing input`);
    rows.push({
      id: fixture.id,
      actionable: expected.actionable,
      expected_disposition: expected.disposition,
      actual_disposition: decision.disposition,
      correct_disposition: correctDisposition,
      correct_target: correctTarget,
      duplicate_targets: duplicateTargets,
      exclusive_misroute: decision.disposition === "deliver" && decision.deliveries.length > 1
        && fixture.sessions.some(session => session.waits.some(wait => wait.exclusive)),
      unnecessary_escalation: decision.disposition === "escalate" && expected.disposition !== "escalate",
      latency_ms: result.telemetry.latency_ms,
      total_tokens: result.telemetry.input_tokens + result.telemetry.output_tokens,
      candidate_fingerprint: payload.candidate_fingerprint,
    });
  }
  const actionable = rows.filter(row => row.actionable);
  const deliverable = rows.filter(row => row.expected_disposition === "deliver");
  const latencies = rows.map(row => row.latency_ms).sort((a, b) => a - b);
  const metrics = {
    fixture_count: rows.length,
    actionable_coverage: ratio(actionable.filter(row => row.actual_disposition !== "dismiss").length, actionable.length),
    target_recall: ratio(deliverable.filter(row => row.correct_disposition && row.correct_target).length, deliverable.length),
    exclusive_misroutes: rows.filter(row => row.exclusive_misroute).length,
    unnecessary_escalations: rows.filter(row => row.unnecessary_escalation).length,
    duplicate_targets: rows.reduce((sum, row) => sum + row.duplicate_targets, 0),
    p95_latency_ms: latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)],
    max_total_tokens: Math.max(...rows.map(row => row.total_tokens)),
  };
  const gates = {
    actionable_coverage: metrics.actionable_coverage === 1,
    target_recall: metrics.target_recall === 1,
    exclusive_misroutes: metrics.exclusive_misroutes === 0,
    unnecessary_escalations: metrics.unnecessary_escalations === 0,
    duplicate_targets: metrics.duplicate_targets === 0,
    p95_latency_ms: metrics.p95_latency_ms <= latencyGateMs,
    max_total_tokens: metrics.max_total_tokens <= tokenGate,
  };
  return { schema_version: 1, passed: Object.values(gates).every(Boolean), metrics, gates, rows };
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : numerator / denominator;
}
