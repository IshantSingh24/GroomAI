"""Strict schema for the GroomAI agent eval dataset.

The schema is intentionally boring: every field either seeds state, asserts
behavior, or routes a case to a judge. Unknown fields are rejected so typos
fail loudly instead of silently weakening a test.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# ── Enums ──────────────────────────────────────────────────────────────────

ToolName = Literal[
    "recall_memory",
    "save_memory",
    "get_profile",
    "update_profile",
    "serper_search",
    "list_inventory",
    "add_inventory_item",
    "delete_inventory_item",
]

MemoryCategory = Literal[
    "preference",
    "habit",
    "skin_detail",
    "hair_detail",
    "lifestyle",
    "general",
]

Category = Literal[
    "scope",
    "safety",
    "p0",
    "budget",
    "recommendation",
    "memory",
    "profile",
    "inventory",
    "multi_turn",
    "edge",
    "style",
]

Priority = Literal["P0", "P1"]

Source = Literal["handwritten", "synthetic", "production"]

JudgeName = Literal[
    "medical_safety",
    "scope_discipline",
    "budget_gate",
    "recommendation_quality",
    "recommendation_grounding",
    "personalization",
    "memory_consistency",
    "profile_discipline",
    "context_carry",
    "style",
    "vision_report",
]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ── Fixtures (state before the turn) ───────────────────────────────────────


class MemorySeed(Strict):
    text: str = Field(min_length=3)
    category: MemoryCategory
    # Prefer saved_days_ago for seeded memories: the store prunes at 90 days,
    # so absolute dates make a fixture rot. saved_at is for recorded data.
    saved_at: str | None = Field(
        default=None, pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$"
    )
    saved_days_ago: int | None = Field(default=None, ge=0, le=365)

    @model_validator(mode="after")
    def _one_timestamp(self) -> "MemorySeed":
        if (self.saved_at is None) == (self.saved_days_ago is None):
            raise ValueError("provide exactly one of saved_at or saved_days_ago")
        return self


class InventorySeed(Strict):
    item_name: str = Field(min_length=2)
    item_price: float = Field(ge=0)
    reason: str = ""


class OtherUserSeed(Strict):
    memory: list[MemorySeed] = Field(default_factory=list)


class Fixtures(Strict):
    user_id: str = Field(default="test-user@example.com", min_length=3)
    date: str = Field(default="2026-10-26", pattern=r"^\d{4}-\d{2}-\d{2}$")
    profile: dict[str, Any] = Field(default_factory=dict)
    memory: list[MemorySeed] = Field(default_factory=list)
    inventory: list[InventorySeed] = Field(default_factory=list)
    other_users: dict[str, OtherUserSeed] = Field(default_factory=dict)
    serper: str | None = None


# ── Expectations (state after the turn) ────────────────────────────────────


class ToolArgCheck(Strict):
    tool: ToolName
    exact: dict[str, Any] = Field(default_factory=dict)
    contains: dict[str, str] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _has_matcher(self) -> "ToolArgCheck":
        if not self.exact and not self.contains:
            raise ValueError("ToolArgCheck needs at least one of exact/contains")
        return self


class ToolExpectations(Strict):
    must_call: list[ToolName] = Field(default_factory=list)
    must_not_call: list[ToolName | Literal["*"]] = Field(default_factory=list)
    # Subsequence, not an exact transcript. Only assert order when it is a
    # product rule (budget -> search, list -> delete).
    order: list[ToolName] = Field(default_factory=list)
    args: list[ToolArgCheck] = Field(default_factory=list)
    max_calls: int | None = Field(default=None, ge=0)


class OutputExpectations(Strict):
    must_contain: list[str] = Field(default_factory=list)
    # Each inner list is an OR-group; every group must match at least once.
    must_contain_any: list[list[str]] = Field(default_factory=list)
    must_not_contain: list[str] = Field(default_factory=list)
    must_match: list[str] = Field(default_factory=list)
    max_words: int | None = Field(default=None, ge=1)
    min_words: int | None = Field(default=None, ge=0)
    max_emojis: int | None = Field(default=None, ge=0)
    require_markdown_link: bool = False
    require_markdown_structure: bool = False


class InventoryExpectation(Strict):
    item_name_contains: str | None = None
    item_price: float | None = Field(default=None, ge=0)
    reason_contains: str | None = None


class MemoryExpectation(Strict):
    text_contains: str = Field(min_length=2)
    category: MemoryCategory | None = None


class StateExpectations(Strict):
    profile: dict[str, Any] = Field(default_factory=dict)
    profile_absent_keys: list[str] = Field(default_factory=list)
    inventory_contains: list[InventoryExpectation] = Field(default_factory=list)
    inventory_absent: list[str] = Field(default_factory=list)
    memory_contains: list[MemoryExpectation] = Field(default_factory=list)


class JudgeExpectation(Strict):
    name: JudgeName
    criteria: list[str] = Field(min_length=1)
    model: str | None = None
    all_must_pass: bool = True


class Expected(Strict):
    refusal: bool = False
    tools: ToolExpectations = Field(default_factory=ToolExpectations)
    output: OutputExpectations = Field(default_factory=OutputExpectations)
    state: StateExpectations = Field(default_factory=StateExpectations)
    judge: JudgeExpectation | None = None

    @model_validator(mode="after")
    def _is_testable(self) -> "Expected":
        has_assertion = any(
            [
                self.tools.must_call,
                self.tools.must_not_call,
                self.tools.order,
                self.tools.args,
                self.output.must_contain,
                self.output.must_contain_any,
                self.output.must_not_contain,
                self.output.must_match,
                self.output.max_words is not None,
                self.output.max_emojis is not None,
                self.output.require_markdown_link,
                self.output.require_markdown_structure,
                self.state.profile,
                self.state.profile_absent_keys,
                self.state.inventory_contains,
                self.state.inventory_absent,
                self.state.memory_contains,
                self.judge is not None,
            ]
        )
        if not has_assertion:
            raise ValueError("case has no assertions")
        return self


# ── Case ───────────────────────────────────────────────────────────────────


class Case(Strict):
    id: str = Field(pattern=r"^[a-z][a-z0-9]*(-[a-z0-9]+)+$")
    category: Category
    priority: Priority
    tags: list[str] = Field(default_factory=list)
    source: Source = "handwritten"
    turns: list[str] = Field(min_length=1)
    fixtures: Fixtures = Field(default_factory=Fixtures)
    expected: Expected
    trials: int = Field(default=1, ge=1, le=5)
    cost_cap_usd: float = Field(default=0.01, gt=0, le=0.05)
    notes: str | None = None

    @model_validator(mode="after")
    def _coherent(self) -> "Case":
        tools = self.expected.tools

        if "*" in tools.must_not_call:
            if len(tools.must_not_call) != 1:
                raise ValueError("'*' must be the only entry in must_not_call")
            if tools.must_call:
                raise ValueError("cannot combine must_not_call=['*'] with must_call")

        overlap = set(tools.must_call) & set(tools.must_not_call)
        if overlap:
            raise ValueError(f"tool both required and forbidden: {sorted(overlap)}")

        missing = set(tools.order) - set(tools.must_call)
        if missing:
            raise ValueError(f"ordered tools must also be in must_call: {sorted(missing)}")

        if self.expected.refusal and tools.must_call:
            raise ValueError("refusal case cannot require tool calls")

        for group in self.expected.output.must_contain_any:
            if not group:
                raise ValueError("must_contain_any contains an empty OR-group")

        if self.priority == "P0" and self.trials < 2:
            raise ValueError("P0 cases need at least 2 trials")

        return self


# ── Manifest ───────────────────────────────────────────────────────────────


class Manifest(Strict):
    dataset: str
    schema_version: int
    version: str
    model_under_test: str
    judge_models: dict[str, str]
    case_count: int = Field(ge=1)
    trial_count: int = Field(ge=1)
    priority_counts: dict[str, int]
    cost_budget_usd: float = Field(gt=0)
    estimated_cost_usd: float = Field(ge=0)
    fixtures: dict[str, list[str]]
    changelog: list[dict[str, str]]


TOOL_NAMES: tuple[str, ...] = (
    "recall_memory",
    "save_memory",
    "get_profile",
    "update_profile",
    "serper_search",
    "list_inventory",
    "add_inventory_item",
    "delete_inventory_item",
)

JUDGE_NAMES: tuple[str, ...] = (
    "medical_safety",
    "scope_discipline",
    "budget_gate",
    "recommendation_quality",
    "recommendation_grounding",
    "personalization",
    "memory_consistency",
    "profile_discipline",
    "context_carry",
    "style",
    "vision_report",
)
