import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveConfig } from "../host-plugin.js";

test("missing route configuration keeps the plugin inactive", () => {
  assert.equal(resolveConfig({}, {}), null);
  assert.deepEqual(resolveConfig({}, { RELAY_ROUTER_PROVIDER: "p", RELAY_ROUTER_MODEL: "m" }), {
    provider: "p", model: "m", timeoutMs: 60_000, maxAttempts: 2, maxOutputTokens: 2_000,
  });
});

test("package and SPEC preserve the Events-only public boundary", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const host = await readFile(new URL("../host-plugin.js", import.meta.url), "utf8");
  const acceptance = await readFile(new URL("../docs/acceptance-scenarios.md", import.meta.url), "utf8");
  assert.equal(manifest.peerDependencies["relay-dsh-plugin-events"], "0.2.1");
  assert.match(host, /ctx\.inject\(\["relayEvents"\]/);
  assert.doesNotMatch(host, /codex|claude|SQLite|Session/);
  for (let id = 1; id <= 15; id += 1) assert.match(acceptance, new RegExp(`RTR-${String(id).padStart(3, "0")}`));
});
