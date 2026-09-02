import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { evaluateSemanticRouter } from "../src/evaluation.mjs";

const fixtures = JSON.parse(await readFile(new URL("../fixtures/quality-set.json", import.meta.url), "utf8"));
const report = await evaluateSemanticRouter(fixtures);
console.log(JSON.stringify(report, null, 2));
assert.equal(report.passed, true, "semantic routing quality gates failed");
