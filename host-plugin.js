import { createDshLlmRoutingAdapter } from "./src/dsh-llm-adapter.mjs";
import { createSinglePassSemanticRouter } from "./src/semantic.mjs";

export const name = "relay-dsh-plugin-semantic-router";
export const inject = ["llm"];

export function apply(ctx, config = {}) {
  const resolved = resolveConfig(config);
  if (!resolved) {
    ctx.logger.warn("Relay Semantic Router is installed but inactive; configure provider and model or RELAY_ROUTER_PROVIDER/RELAY_ROUTER_MODEL.");
    return;
  }
  const fiber = ctx.inject(["relayEvents"], scope => {
    if (scope.relayEvents.apiVersion !== 1) {
      throw new Error(`Semantic Router requires relayEvents API v1, received ${scope.relayEvents.apiVersion}`);
    }
    const abort = new AbortController();
    const router = createSinglePassSemanticRouter({
      adapter: createDshLlmRoutingAdapter({ llm: scope.llm, ...resolved, signal: abort.signal }),
      maxAttempts: resolved.maxAttempts,
    });
    scope.effect(() => {
      const unregister = scope.relayEvents.registerRouter(router);
      return () => { unregister(); abort.abort(new Error("Semantic Router is shutting down")); };
    }, "relay semantic router provider");
  });
  ctx.effect(() => () => fiber.dispose(), "relay semantic router injection");
}

export function resolveConfig(config = {}, env = process.env) {
  const provider = nonEmpty(config.provider) ?? nonEmpty(env.RELAY_ROUTER_PROVIDER);
  const model = nonEmpty(config.model) ?? nonEmpty(env.RELAY_ROUTER_MODEL);
  if (!provider || !model) return null;
  return {
    provider,
    model,
    timeoutMs: Math.min(60_000, positiveInteger(config.timeoutMs, 60_000)),
    maxAttempts: boundedInteger(config.maxAttempts, 2, 1, 3),
    maxOutputTokens: boundedInteger(config.maxOutputTokens, 2_000, 128, 8_192),
  };
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function boundedInteger(value, fallback, minimum, maximum) {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}
