# Relay Semantic Router for DeepSeek Harness

> **Now supports the latest DSH `0.1.2-alpha.3`.** Plugin `0.2.1` is verified on DSH `0.1.2-alpha.3`, `0.1.2-alpha.2`, and `0.1.1-rc.2`. [Install it and try the latest DSH](https://www.npmjs.com/package/relay-dsh-plugin-semantic-router) · [Compatibility details](docs/dsh-0.1.2-alpha.3.md).

```bash
npx @deepseek-ai/dsh@0.1.2-alpha.3 plugin --profile web add relay-dsh-plugin-events@0.2.1 relay-dsh-plugin-semantic-router@0.2.1
npx @deepseek-ai/dsh@0.1.2-alpha.3 web
```

[![DSH compatibility](https://img.shields.io/badge/DSH-0.1.1--rc.2%20%7C%200.1.2--alpha.2%20%7C%200.1.2--alpha.3-2f7d68)](https://github.com/deepseek-ai/deepseek-harness)

English | [中文](README.zh.md)

`relay-dsh-plugin-semantic-router` registers a recall-oriented model Router with
`relay-dsh-plugin-events`. It decides `deliver`, `escalate`, or `dismiss` from a
normalized Event and compact active-Wait snapshot. It stores nothing and never
admits a DSH Session itself.

The older `internal` npm channel remains available for integration testing and
does not carry this compatibility guarantee. Use the exact `0.2.1`
versions in the latest-DSH command above; do not substitute `@internal`.

```bash
dsh plugin --profile web add --save-exact \
  relay-dsh-plugin-events@internal \
  relay-dsh-plugin-semantic-router@internal
```

Configure an existing DSH LLM route with `RELAY_ROUTER_PROVIDER` and
`RELAY_ROUTER_MODEL`. Missing configuration is a contained inactive state; Events
continues exact fallback routing.

Build this repository with `DSH_ROOT` pointing to a prepared official DSH checkout:
`npm ci --ignore-scripts && npm run verify && npm pack`. Install the resulting
tarballs together. The npm package includes built `lib/`; raw GitHub source does
not. Each model attempt is bounded to at most 60 seconds, with 1–3 attempts.
Unloading cancels the active request without starting another retry.

See [SPEC.md](SPEC.md) and [delivery scenarios](docs/acceptance-scenarios.md).
Tested official DSH references: `0.1.1-rc.2` at
`b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`, `0.1.2-alpha.2` at
`0a53fb55bea101816fa226bb964ae2bed71c343b`, and `0.1.2-alpha.3` at `dd6322d604e00eec1ba5e0c8541159906a21094a`.
