"""Validate the GroomAI eval dataset and report coverage + estimated cost.

Usage:
    backend/.venv/bin/python -m evals.validate
    backend/.venv/bin/python -m evals.validate --show budget-ask
    backend/.venv/bin/python -m evals.validate --json
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from pydantic import ValidationError

from evals.schema import (
    JUDGE_NAMES,
    TOOL_NAMES,
    Case,
    Manifest,
)

ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "dataset"
CASES_PATH = DATASET_DIR / "cases.jsonl"
MANIFEST_PATH = DATASET_DIR / "manifest.json"
SERPER_DIR = ROOT / "fixtures" / "serper"

MEMORY_TTL_DAYS = 90  # keep in sync with backend/app/memory/store.py

# Cost assumptions. Documented in README; deliberately conservative.
AGENT_IN_USD_PER_TOKEN = 0.15 / 1_000_000  # gpt-4o-mini
AGENT_OUT_USD_PER_TOKEN = 0.60 / 1_000_000
JUDGE_RATES = {
    "gpt-5-nano": (0.05 / 1_000_000, 0.40 / 1_000_000),
    "gpt-6-luna": (0.10 / 1_000_000, 0.50 / 1_000_000),
}
AGENT_IN_TOKENS_PER_CALL = 2_400
AGENT_OUT_TOKENS_PER_CALL = 150
JUDGE_IN_TOKENS = 1_300
JUDGE_OUT_TOKENS = 220


def load_cases() -> list[Case]:
    cases: list[Case] = []
    errors: list[str] = []

    for line_no, raw in enumerate(CASES_PATH.read_text(encoding="utf-8").splitlines(), 1):
        raw = raw.strip()
        if not raw:
            continue
        try:
            cases.append(Case.model_validate_json(raw))
        except ValidationError as exc:
            errors.append(f"{CASES_PATH.name}:{line_no}: {exc}")

    if errors:
        raise SystemExit("\n".join(errors))
    return cases


def load_manifest() -> Manifest:
    return Manifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))


def estimate_case(case: Case) -> float:
    calls = 1 + len(case.turns)
    if case.fixtures.serper:
        calls += 2
    if case.expected.tools.must_call:
        calls += 1
    if (
        case.expected.state.profile
        or case.expected.state.inventory_contains
        or case.expected.state.memory_contains
    ):
        calls += 1

    agent_cost = calls * (
        AGENT_IN_TOKENS_PER_CALL * AGENT_IN_USD_PER_TOKEN
        + AGENT_OUT_TOKENS_PER_CALL * AGENT_OUT_USD_PER_TOKEN
    )

    judge_cost = 0.0
    if case.expected.judge:
        rate = JUDGE_RATES.get(case.expected.judge.model or "gpt-5-nano")
        if rate is None:
            raise SystemExit(
                f"{case.id}: unknown judge model {case.expected.judge.model!r}"
            )
        judge_cost = JUDGE_IN_TOKENS * rate[0] + JUDGE_OUT_TOKENS * rate[1]

    return (agent_cost + judge_cost) * case.trials


def check(cases: list[Case], manifest: Manifest) -> list[str]:
    errors: list[str] = []

    ids = [c.id for c in cases]
    duplicates = [cid for cid, n in Counter(ids).items() if n > 1]
    if duplicates:
        errors.append(f"duplicate case ids: {duplicates}")

    if len(cases) != manifest.case_count:
        errors.append(
            f"manifest.case_count={manifest.case_count}, file has {len(cases)}"
        )

    trials = sum(c.trials for c in cases)
    if trials != manifest.trial_count:
        errors.append(f"manifest.trial_count={manifest.trial_count}, actual {trials}")

    priorities = Counter(c.priority for c in cases)
    expected_priorities = manifest.priority_counts
    for key in ("P0", "P1"):
        want = expected_priorities.get(key, 0)
        got = priorities.get(key, 0)
        if want != got:
            errors.append(f"manifest priority_counts[{key}]={want}, actual {got}")

    if manifest.case_count > 40:
        errors.append("core suite is over 40 cases; move low-signal cases to replay/unit tests")

    if manifest.estimated_cost_usd > manifest.cost_budget_usd:
        errors.append(
            f"estimated cost ${manifest.estimated_cost_usd:.3f} exceeds "
            f"budget ${manifest.cost_budget_usd:.3f}"
        )

    computed = sum(estimate_case(c) for c in cases)
    if abs(computed - manifest.estimated_cost_usd) > 0.005:
        errors.append(
            f"manifest.estimated_cost_usd={manifest.estimated_cost_usd:.3f}, "
            f"validator computes ${computed:.3f}; update the manifest"
        )

    covered_tools = {
        tool
        for c in cases
        for tool in c.expected.tools.must_call
    }
    missing_tools = sorted(set(TOOL_NAMES) - covered_tools)
    if missing_tools:
        errors.append(f"tools never required by a case: {missing_tools}")

    for c in cases:
        if c.fixtures.serper and not (SERPER_DIR / c.fixtures.serper).is_file():
            errors.append(f"{c.id}: missing serper fixture {c.fixtures.serper}")

        seeds = list(c.fixtures.memory)
        for other in c.fixtures.other_users.values():
            seeds.extend(other.memory)
        for seed in seeds:
            if seed.saved_days_ago is not None and seed.saved_days_ago >= MEMORY_TTL_DAYS:
                errors.append(
                    f"{c.id}: memory seed {seed.text!r} is {seed.saved_days_ago} days old; "
                    f"store TTL is {MEMORY_TTL_DAYS}"
                )

        if c.fixtures.other_users and c.category != "p0":
            errors.append(f"{c.id}: other_users is only for isolation cases")

    for fixture in manifest.fixtures.get("serper", []):
        if not (SERPER_DIR / fixture).is_file():
            errors.append(f"manifest references missing fixture {fixture}")

    for c in cases:
        if c.expected.judge and c.expected.judge.name not in JUDGE_NAMES:
            errors.append(f"{c.id}: unknown judge {c.expected.judge.name}")

    return errors


def report(cases: list[Case], manifest: Manifest) -> dict:
    est = sum(estimate_case(c) for c in cases)
    by_category = Counter(c.category for c in cases)
    by_priority = Counter(c.priority for c in cases)
    tool_usage = {tool: 0 for tool in TOOL_NAMES}
    judge_usage = {judge: 0 for judge in JUDGE_NAMES}

    for c in cases:
        for tool in set(c.expected.tools.must_call):
            tool_usage[tool] += 1
        if c.expected.judge:
            judge_usage[c.expected.judge.name] += 1

    p0_without_judge = [
        c.id for c in cases if c.priority == "P0" and c.expected.judge is None
    ]

    return {
        "dataset": manifest.dataset,
        "version": manifest.version,
        "cases": len(cases),
        "trials": sum(c.trials for c in cases),
        "by_priority": dict(by_priority),
        "by_category": dict(sorted(by_category.items())),
        "tool_usage": tool_usage,
        "judge_usage": {k: v for k, v in judge_usage.items() if v},
        "unused_judges": [k for k, v in judge_usage.items() if v == 0],
        "p0_deterministic_only": p0_without_judge,
        "estimated_cost_usd": round(est, 4),
        "budget_usd": manifest.cost_budget_usd,
        "headroom_usd": round(manifest.cost_budget_usd - est, 4),
    }


def print_report(r: dict) -> None:
    print(f"{r['dataset']}  {r['version']}")
    print(
        f"cases {r['cases']}  trials {r['trials']}  "
        f"P0 {r['by_priority'].get('P0', 0)}  P1 {r['by_priority'].get('P1', 0)}"
    )

    print("\ncategory")
    for name, count in r["by_category"].items():
        print(f"  {name:<15} {count}")

    print("\ntool coverage (cases that require the tool)")
    for name, count in r["tool_usage"].items():
        flag = "ok" if count else "MISSING"
        print(f"  {name:<22} {count:>2}  {flag}")

    print("\njudges")
    for name, count in r["judge_usage"].items():
        print(f"  {name:<28} {count}")

    if r["unused_judges"]:
        print(f"  unused (reserved): {', '.join(r['unused_judges'])}")

    print(
        f"\nestimated run  ${r['estimated_cost_usd']:.3f}  "
        f"budget ${r['budget_usd']:.2f}  "
        f"headroom ${r['headroom_usd']:.3f}"
    )
    if r["p0_deterministic_only"]:
        print(f"P0 with deterministic checks only: {', '.join(r['p0_deterministic_only'])}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--show", metavar="ID", help="pretty-print one case and exit")
    parser.add_argument("--json", action="store_true", help="machine-readable report")
    args = parser.parse_args()

    cases = load_cases()
    manifest = load_manifest()

    if args.show:
        match = next((c for c in cases if c.id == args.show), None)
        if match is None:
            print(f"unknown case: {args.show}", file=sys.stderr)
            return 1
        print(
            json.dumps(
                match.model_dump(mode="json", exclude_none=True),
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0

    errors = check(cases, manifest)
    if errors:
        print("dataset invalid", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    result = report(cases, manifest)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)
        print("\nschema ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
