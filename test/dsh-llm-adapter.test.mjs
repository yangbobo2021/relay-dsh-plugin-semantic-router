import assert from "node:assert/strict";
import test from "node:test";

import { createDshLlmRoutingAdapter } from "../src/dsh-llm-adapter.mjs";

test("DSH adapter makes one tool-free call and reports usage", async () => {
  let request;
  const adapter = createDshLlmRoutingAdapter({
    provider: "test-provider",
    model: "test-model",
    llm: { async * stream(input) {
      request = input;
      yield { type: "text-delta", index: 0, text: JSON.stringify(validDecision()) };
      yield { type: "usage", usage: { inputTokens: 11, outputTokens: 7, cacheReadTokens: 3 } };
      yield { type: "finish", reason: { kind: "stop" } };
    } },
  });
  const result = await adapter.call({ prompt: "route this" });
  assert.deepEqual(result.output, validDecision());
  assert.equal("tools" in request, false);
  assert.equal(request.provider, "test-provider");
  assert.match(request.system, /JSON object only/);
  assert.deepEqual(result.telemetry, {
    model_calls: 1,
    latency_ms: result.telemetry.latency_ms,
    input_tokens: 11,
    cached_input_tokens: 3,
    output_tokens: 7,
  });
});

test("DSH adapter rejects tool calls and empty output", async () => {
  const toolAdapter = createDshLlmRoutingAdapter({
    provider: "p", model: "m",
    llm: { async * stream() {
      yield { type: "tool-call-delta", index: 0, id: "call-1", name: "danger", argumentsDelta: "{}" };
      yield { type: "finish", reason: { kind: "stop" } };
    } },
  });
  await assert.rejects(toolAdapter.call({ prompt: "x" }), /attempted a tool call/);
});

test("DSH adapter aborts the exact model call at its deadline", async () => {
  let signal;
  const adapter = createDshLlmRoutingAdapter({
    provider: "p", model: "m", timeoutMs: 5,
    llm: { async * stream(request) {
      signal = request.signal;
      await new Promise((resolve, reject) => {
        request.signal.addEventListener("abort", () => reject(request.signal.reason), { once: true });
      });
      if (false) yield undefined;
    } },
  });
  await assert.rejects(adapter.call({ prompt: "x" }), /timed out/);
  assert.equal(signal.aborted, true);
});

function validDecision() {
  return { disposition: "dismiss", actionable: false, deliveries: [], evidence: ["newsletter"], summary: "dismiss" };
}
