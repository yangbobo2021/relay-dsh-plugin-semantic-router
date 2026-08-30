# Semantic Router Test Review

## Review 1 — extracted routing policy

- Preserved compact-payload and invalid-decision retry coverage.
- Replaced the legacy global Codex CLI adapter with DSH `llm.stream()`.
- Asserted that routing model calls receive no tools.

## Review 2 — decision safety

- Added explicit deliver, escalate, and dismiss outcomes.
- Added retry exhaustion, exclusive-conflict failure, timeout cancellation,
  telemetry, and tool-call rejection.

Cordis late activation/disposal and packed Events composition run in Relay's
cross-plugin delivery harness.
