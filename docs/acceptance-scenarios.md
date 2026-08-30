# Semantic Router Delivery Acceptance Scenarios

Official DSH reference: `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`

| ID | Scenario | Required result | Evidence |
| --- | --- | --- | --- |
| RTR-001 | Router-only boot | Packed plugin can be installed without Events and parks without failing DSH startup. | official DSH |
| RTR-002 | Late Events activation | Installing/activating Events later registers the Router without restarting Router code. | Cordis contract |
| RTR-003 | Missing configuration | Missing provider/model registers no Router, emits one actionable warning, and makes no model call. | unit |
| RTR-004 | Valid delivery | A valid model decision selects the correct existing Session and matched Waits. | unit |
| RTR-005 | Escalation | Actionable unmatched input returns `escalate` with no Delivery. | unit |
| RTR-006 | Dismissal | Positively non-actionable input returns `dismiss`. | unit |
| RTR-007 | Invalid output retry | Invalid JSON/schema output is retried once and a corrected decision succeeds. | unit |
| RTR-008 | Terminal invalid output | Exhausted retries reject; no fabricated fallback decision is returned. | unit |
| RTR-009 | Exclusive conflict | A decision delivering one exclusive Wait to several Sessions is rejected. | contract |
| RTR-010 | Tool-free call | DSH LLM request contains no tools and carries a routing-specific system policy. | fake LLM |
| RTR-011 | Timeout/cancellation | Deadline aborts the exact model call and releases resources. | fake clock |
| RTR-012 | Telemetry | Result reports model identity, call count, latency, and token usage when provided. | unit |
| RTR-013 | Provider replacement | Unload removes only this Router; Events exact fallback resumes. | Cordis lifecycle |
| RTR-014 | Package boundary | Tarball has no Relay parent imports, execution-backend code, source tree, or secrets. | pack/static |
| RTR-015 | Configured composition | Events+Router packed tarballs boot in official DSH with a fake/replay LLM route. | official DSH |

