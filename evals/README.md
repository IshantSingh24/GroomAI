# GroomAI agent evals

A 30-case core suite for the main text agent. It is deliberately small: one
case per failure mode, deterministic checks first, judges only where the
behavior is genuinely subjective.

Vision analysis and storage behavior are **not** in this suite. Vision has a
separate image suite; memory dedup/TTL, profile validation, inventory CRUD, and
message assembly belong in free unit tests. Testing those through a live LLM
costs money and catches fewer bugs.

## Files

```
evals/
  schema.py              strict Pydantic schema; unknown fields are rejected
  validate.py            loader, coverage report, cost estimate
  dataset/
    manifest.json        version, counts, models, budget
    cases.jsonl          one case per line
  fixtures/serper/       frozen search doubles, replayed by the harness
```

## Run

```bash
# free checks
backend/.venv/bin/python -m evals.validate
backend/.venv/bin/python -m evals.validate --show budget-ask
backend/.venv/bin/python -m evals.validate --json

# live agent + judge run
backend/.venv/bin/python -m evals.harness
backend/.venv/bin/python -m evals.harness --case safety-red-flag
backend/.venv/bin/python -m evals.harness --cases inv-add,inv-delete,inv-list
backend/.venv/bin/python -m evals.harness --limit 5
```

`validate` fails on duplicate IDs, missing fixtures, uncovered tools, count
drift against the manifest, and an estimate over budget.

The harness needs `OPENAI_API_KEY` in `.env` or the environment. It runs the
pinned agent model, replays the frozen Serper fixture for each case, and uses a
throwaway SQLite database plus a fresh memory directory under
`/tmp/opencode/groomai-evals/`. It never touches the production database or
the repository's `memory_store/`. Results are written to
`evals/reports/run-<timestamp>.json` (gitignored) and summarized on stdout.

Each trial passes a `GroomContext` to the agent. `get_profile` and
`recall_memory` mark the context as loaded, and `serper_search` is hidden until
both have run and the user has stated a budget. This makes the context and
budget gates deterministic instead of prompt-only. Serper fixtures mirror the
raw search response, so product links use the `link` key.

The harness enforces both the manifest budget and each case's
`cost_cap_usd`. A case that exceeds its cap is failed, not just reported.

## Case contract

| Field | Purpose |
|---|---|
| `id` | Stable, descriptive. Referenced by CI output and dashboards. |
| `category` / `priority` | Routing and release gating. `P0` runs twice. |
| `turns` | User messages in order. Multi-turn cases are real conversations. |
| `fixtures` | State before the first turn: user, date, profile, memory, inventory, Serper file. |
| `expected.tools` | `must_call`, `must_not_call`, subsequence `order`, argument checks, call cap. |
| `expected.output` | Literal/regex checks, word/emoji caps, markdown requirements. |
| `expected.state` | Post-conditions for profile, inventory, and memory. |
| `expected.judge` | Named judge + explicit binary criteria. |
| `trials` | Repeat count. `P0` must be at least 2. |
| `cost_cap_usd` | Per-case ceiling; the harness should fail a runaway case, not just report it. |

Matching convention for the harness: output checks are case-insensitive and
whitespace-normalized. `must_contain_any` is a list of OR-groups; every group
must match. `must_not_call: ["*"]` means the case must not call any tool.

Every case declares `trials` and `cost_cap_usd` explicitly. Memory seeds use
`saved_days_ago` rather than absolute timestamps because the store prunes at
90 days; an older fixture would pass for the wrong reason. `validate` rejects
seeds that cross that cutoff.

## Design rules

1. **One failure mode per case.** If a case can fail for two unrelated reasons,
   split it.
2. **Deterministic before judge.** Currency, links, tool choice, call order, and
   `user_id` are code checks. Judges are reserved for safety nuance, relevance,
   grounding, personalization, and tone.
3. **Assert order only when it is a product rule.** Budget before search, list
   before delete, recall before recommendation. Everything else is outcome-based.
4. **No live services.** Every Serper case points at a fixture. Dates are
   frozen. Memory and database state are seeded per case.
5. **Negative cases are first-class.** Out-of-domain, empty search results,
   uncertain profile input, and ambiguous requests are where trust is won.
6. **Unknown fields fail.** A typo in an assertion should not silently weaken
   the suite.

## Cost

Assumptions in `validate.py`:

- Agent: `gpt-4o-mini` at $0.15 / $0.60 per 1M input/output tokens
- Judge: `gpt-5-nano` at $0.05 / $0.40; P0 safety uses `gpt-6-luna` at $0.10 / $0.50
- 2,400 input + 150 output tokens per agent call; 1,300 + 220 per judge call

Current estimate: **~$0.058 per full run**, against a **$0.10** budget. The
estimate moves with `turns`, `serper`, and `trials`, so the validator is the
source of truth, not this paragraph.

## Adding a case

1. Append one JSON object per line to `dataset/cases.jsonl`.
2. Update `case_count`, `trial_count`, and `priority_counts` in `manifest.json`.
3. Add any new Serper fixture to `fixtures/serper/` and to `manifest.fixtures.serper`.
4. Run `validate`; it will tell you what is missing or over budget.

If a case is P0, give it `trials: 2` and make the failure mode unambiguous. If
it needs a judge, add explicit binary criteria — never a single "quality" flag.

## Review checklist

Before adding a case, ask:

- Does this cover a new failure mode, or repeat one already covered?
- Can a free unit test catch it instead?
- Is the expected behavior a rule, a trajectory, or a rubric? Use the weakest
  check that can catch the failure.
- If the judge disappeared tomorrow, would the case still catch the bug?
