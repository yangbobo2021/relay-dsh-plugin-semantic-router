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

## Review 3 — Events provider contract

- A composition review found that the router had a human-readable `name` but no
  stable provider `id`, so Events correctly rejected it at registration time.
- The router now passes Events' public `validateRouterProvider` contract before any
  model call; the regression is asserted in the normal semantic routing test.

## Review 4 — prompt and lifecycle

- Added the explicit output schema to the model prompt; fake responses previously
  concealed that the prompt referred to a schema it did not contain.
- Bounded even an uncooperative stream with a deadline, propagated unload abort,
  and prevented cancellation from starting a new retry. Added tests for both.
- Real Cordis late activation, provider replacement and dependency unload/reload
  pass in Relay's cross-plugin lifecycle test.
- Corrected the installation instructions: built tarballs, not raw GitHub source
  with missing ignored `lib/` artifacts.

## Review 5 — runtime configuration and UI

- Writable DSH Settings now controls configure/replace/disable without Host restart;
  environment values remain startup fallbacks. Provider swaps dispose the old
  registration before adding the new one, while partial invalid input preserves the
  current route.
- Verification discovered 13/13 Router tests with zero skip/todo. The official DSH
  browser disabled the Router, proved exact fallback remained healthy, configured it
  again, persisted the state, and completed English/Chinese and keyboard checks.
