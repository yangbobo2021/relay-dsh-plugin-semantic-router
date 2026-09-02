import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createRouterController, resolveConfig } from "../host-plugin.js";

test("missing route configuration keeps the plugin inactive", () => {
  assert.equal(resolveConfig({}, {}), null);
  assert.deepEqual(resolveConfig({}, { RELAY_ROUTER_PROVIDER: "p", RELAY_ROUTER_MODEL: "m" }), {
    provider: "p", model: "m", timeoutMs: 60_000, maxAttempts: 2, maxOutputTokens: 2_000,
  });
});

test("EP14-010 runtime configuration registers, replaces, aborts, and unregisters safely", async () => {
  let registered;
  let registerCount = 0;
  let unregisterCount = 0;
  let observedSignal;
  const scope = {
    llm: { async * stream(request) {
      observedSignal = request.signal;
      await new Promise((resolve, reject) => request.signal.addEventListener("abort",
        () => reject(request.signal.reason), { once: true }));
      if (false) yield undefined;
    } },
    relayEvents: {
      registerRouter(provider) {
        registerCount += 1;
        registered = provider;
        return () => { unregisterCount += 1; };
      },
    },
  };
  const controller = createRouterController(scope);
  controller.update(resolveConfig({ provider: "first", model: "model-a", timeoutMs: 60_000 }, {}));
  assert.equal(registerCount, 1);
  assert.equal(registered.model, "model-a");
  const pending = registered.route({ event: {}, sessions: [] });
  await new Promise(resolve => setImmediate(resolve));
  controller.update(resolveConfig({ provider: "second", model: "model-b" }, {}));
  await assert.rejects(pending, /configuration changed/);
  assert.equal(observedSignal.aborted, true);
  assert.equal(registerCount, 1, "a configured-to-configured update must not publish a registration gap");
  assert.equal(unregisterCount, 0);
  assert.equal(registered.model, "model-b");
  controller.update(null);
  assert.equal(unregisterCount, 1);
  controller.dispose();
  assert.equal(unregisterCount, 1, "dispose after disable must be idempotent");
});

test("package and SPEC preserve the Events-only public boundary", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const host = await readFile(new URL("../host-plugin.js", import.meta.url), "utf8");
  const acceptance = await readFile(new URL("../docs/acceptance-scenarios.md", import.meta.url), "utf8");
  assert.equal(manifest.peerDependencies["relay-dsh-plugin-events"], manifest.version);
  assert.match(host, /ctx\.inject\(\["relayEvents"\]/);
  assert.doesNotMatch(host, /codex|claude|SQLite|Session/);
  for (let id = 1; id <= 17; id += 1) assert.match(acceptance, new RegExp(`RTR-${String(id).padStart(3, "0")}`));
});
