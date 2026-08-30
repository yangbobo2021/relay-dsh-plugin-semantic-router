# Relay Semantic Router for DeepSeek Harness

`relay-dsh-plugin-semantic-router` registers a recall-oriented model Router with
`relay-dsh-plugin-events`. It decides `deliver`, `escalate`, or `dismiss` from a
normalized Event and compact active-Wait snapshot. It stores nothing and never
admits a DSH Session itself.

```bash
dsh plugin --profile web add \
  ./relay-dsh-plugin-events-0.1.0.tgz \
  ./relay-dsh-plugin-semantic-router-0.1.0.tgz
```

Configure an existing DSH LLM route with `RELAY_ROUTER_PROVIDER` and
`RELAY_ROUTER_MODEL`. Missing configuration is a contained inactive state; Events
continues exact fallback routing.

Build this repository with `DSH_ROOT` pointing to a prepared official DSH checkout:
`npm ci --ignore-scripts && npm run verify && npm pack`. Install the resulting
tarballs together. Raw GitHub source does not contain built `lib/`; npm publication
is not claimed. Each model attempt is bounded to at most 60 seconds, with 1–3
attempts. Unloading cancels the active request without starting another retry.

See [SPEC.md](SPEC.md) and [delivery scenarios](docs/acceptance-scenarios.md).
Tested official DSH reference:
`b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`.
