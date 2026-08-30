# Relay DSH Semantic Router Plugin Specification

Status: Accepted for `0.1.0`

## Purpose

`relay-dsh-plugin-semantic-router` contributes one recall-oriented Router to the
`relayEvents` service. It uses the configured DSH LLM provider/model to decide
whether an external Event should be delivered to existing Sessions, escalated, or
dismissed.

## Boundary

The plugin owns:

- compact routing payload and prompt construction;
- one tool-free DSH LLM call with one validation retry;
- structured JSON parsing, decision validation, and usage/latency telemetry;
- registration and disposal of one Router provider.

The plugin does not own:

- Event or Wait persistence;
- Delivery creation or DSH Session admission;
- exact fallback routing;
- notification delivery after `escalate`;
- provider credentials or model adapters;
- any execution-backend implementation.

## Configuration

`provider` and `model` select an already registered DSH LLM route. They may also be
supplied through `RELAY_ROUTER_PROVIDER` and `RELAY_ROUTER_MODEL`. When either is
missing, the plugin remains installed but registers no Router and logs one actionable
warning; Events continues using exact fallback. `timeoutMs`, `maxAttempts`, and
`maxOutputTokens` are bounded.
Each call has a maximum 60-second deadline; attempts are limited to 1–3 (default 2).
Unload aborts the active call and never starts a cancellation retry.

## Routing Contract

- External Event content is untrusted evidence, never instructions.
- The model receives no tools and no external knowledge.
- `deliver` may select several Sessions only when no selected relationship violates
  exclusive Wait ownership.
- `escalate` is required for actionable input with no safe target.
- `dismiss` is allowed only for positively non-actionable input.
- Invalid JSON or an invalid decision is retried once by default, then fails without
  committing a routing decision; Events retains the Event for retry.

## Delivery Acceptance

The executable scenario list is in
[`docs/acceptance-scenarios.md`](docs/acceptance-scenarios.md).
