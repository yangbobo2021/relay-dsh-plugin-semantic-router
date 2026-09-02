import z from "@deepseek-ai/schemastery";

import { createDshLlmRoutingAdapter } from "./src/dsh-llm-adapter.mjs";
import { createSinglePassSemanticRouter } from "./src/semantic.mjs";

export const name = "relay-dsh-plugin-semantic-router";
export const inject = ["llm"];

export const ROUTER_SETTINGS_NAMESPACE = "relay-semantic-router";
export const ROUTER_SETTINGS_SCHEMA = z.object({
  provider: z.string().default(""),
  model: z.string().default(""),
  timeoutMs: z.number().default(60_000),
  maxAttempts: z.number().default(2),
  maxOutputTokens: z.number().default(2_000),
});

export function apply(ctx, config = {}) {
  const base = settingsValue(config);
  let source = () => base;
  let settingsAvailable = false;
  const listeners = new Set();
  const publish = () => {
    const value = source();
    for (const listener of listeners) listener(value);
  };

  ctx.inject(["settings"], settingsCtx => {
    settingsAvailable = true;
    settingsCtx.settings.installSection(ctx, ROUTER_SETTINGS_NAMESPACE, ROUTER_SETTINGS_SCHEMA, base, {
      setSource: current => { source = current; },
      onChange: publish,
    });
    settingsCtx.effect(() => () => {
      settingsAvailable = false;
      source = () => base;
      publish();
    }, "relay semantic router settings availability");
  });

  const fiber = ctx.inject(["relayEvents"], scope => {
    if (scope.relayEvents.apiVersion !== 1) {
      throw new Error(`Semantic Router requires relayEvents API v1, received ${scope.relayEvents.apiVersion}`);
    }
    const controller = createRouterController(scope);
    const update = value => controller.update(resolveConfig(value, {}));
    listeners.add(update);
    update(source());

    const management = scope.relayEvents.registerConnectorProvider({
      id: "relay.semantic-router",
      async inspect() {
        const resolved = resolveConfig(source(), {});
        return {
          kind: "router",
          state: controller.error ? "degraded" : resolved ? "healthy" : "unconfigured",
          provider: resolved?.provider ?? "",
          model: resolved?.model ?? "",
          configuration_writable: settingsAvailable,
          last_error_class: controller.error ? "router_registration_failed" : null,
        };
      },
      async execute(action, input) {
        const settings = scope.get("settings");
        if (!settingsAvailable || !settings) {
          throw new Error("Semantic Router settings are unavailable or read-only");
        }
        if (action === "configure") {
          const next = validateManagementConfig(input);
          await settings.replace(ROUTER_SETTINGS_NAMESPACE, next,
            Number.isSafeInteger(input?.expected_revision) ? { expectedRevision: input.expected_revision } : undefined);
          update(source());
          return;
        }
        if (action === "disable") {
          const current = source();
          await settings.replace(ROUTER_SETTINGS_NAMESPACE, {
            ...current,
            provider: "",
            model: "",
          }, Number.isSafeInteger(input?.expected_revision) ? { expectedRevision: input.expected_revision } : undefined);
          update(source());
          return;
        }
        throw new Error(`unsupported Semantic Router action ${action}`);
      },
    });
    scope.effect(() => () => {
      listeners.delete(update);
      management();
      controller.dispose();
    }, "relay semantic router lifecycle");
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

export function createRouterController(scope) {
  let resolved = null;
  let unregister = null;
  let lifecycleAbort = null;
  const provider = {
    id: "relay.semantic-router",
    get name() { return `dsh:${resolved?.provider ?? "unconfigured"}`; },
    get model() { return resolved?.model ?? null; },
    async route(input) {
      const snapshot = resolved;
      const signal = lifecycleAbort?.signal;
      if (!snapshot || !signal) throw new Error("Semantic Router is not configured");
      return createSinglePassSemanticRouter({
        adapter: createDshLlmRoutingAdapter({ llm: scope.llm, ...snapshot, signal }),
        maxAttempts: snapshot.maxAttempts,
      }).route(input);
    },
  };
  return {
    error: null,
    update(next) {
      if (sameConfig(resolved, next)) return;
      lifecycleAbort?.abort(new Error("Semantic Router configuration changed"));
      lifecycleAbort = null;
      this.error = null;
      if (!next) {
        unregister?.();
        unregister = null;
        resolved = null;
        return;
      }
      resolved = next;
      lifecycleAbort = new AbortController();
      if (!unregister) {
        try { unregister = scope.relayEvents.registerRouter(provider); }
        catch (error) {
          lifecycleAbort.abort(error);
          lifecycleAbort = null;
          resolved = null;
          this.error = error;
        }
      }
    },
    dispose() {
      lifecycleAbort?.abort(new Error("Semantic Router is shutting down"));
      lifecycleAbort = null;
      unregister?.();
      unregister = null;
      resolved = null;
    },
  };
}

function settingsValue(config, env = process.env) {
  return {
    provider: nonEmpty(config.provider) ?? nonEmpty(env.RELAY_ROUTER_PROVIDER) ?? "",
    model: nonEmpty(config.model) ?? nonEmpty(env.RELAY_ROUTER_MODEL) ?? "",
    timeoutMs: Math.min(60_000, positiveInteger(config.timeoutMs, 60_000)),
    maxAttempts: boundedInteger(config.maxAttempts, 2, 1, 3),
    maxOutputTokens: boundedInteger(config.maxOutputTokens, 2_000, 128, 8_192),
  };
}

function validateManagementConfig(input) {
  const provider = nonEmpty(input?.provider);
  const model = nonEmpty(input?.model);
  if (!provider || provider.length > 256 || !model || model.length > 512) {
    throw new Error("Semantic Router provider and model are required and must be bounded");
  }
  return {
    provider,
    model,
    timeoutMs: boundedInteger(input?.timeout_ms, 60_000, 1_000, 60_000),
    maxAttempts: boundedInteger(input?.max_attempts, 2, 1, 3),
    maxOutputTokens: boundedInteger(input?.max_output_tokens, 2_000, 128, 8_192),
  };
}

function sameConfig(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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
