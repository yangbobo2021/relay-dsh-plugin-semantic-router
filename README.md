# Relay Semantic Router for DeepSeek Harness

`relay-dsh-plugin-semantic-router` registers a recall-oriented model Router with
`relay-dsh-plugin-events`. It decides `deliver`, `escalate`, or `dismiss` from a
normalized Event and compact active-Wait snapshot. It stores nothing and never
admits a DSH Session itself.

```bash
dsh plugin --profile web add \
  github:yangbobo2021/relay-dsh-plugin-events#main \
  github:yangbobo2021/relay-dsh-plugin-semantic-router#main
```

Configure an existing DSH LLM route with `RELAY_ROUTER_PROVIDER` and
`RELAY_ROUTER_MODEL`. Missing configuration is a contained inactive state; Events
continues exact fallback routing.

See [SPEC.md](SPEC.md) and [delivery scenarios](docs/acceptance-scenarios.md).
Tested official DSH reference:
`b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`.
