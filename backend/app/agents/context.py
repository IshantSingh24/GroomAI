"""Per-run session state shared by the GroomAI tools.

The context is passed to ``Runner.run`` / ``Runner.run_streamed`` and is not
sent to the model. Tools use it to enforce ordering and safety constraints that
should not depend on prompt-following alone.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


_BUDGET_RE = re.compile(
    r"(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?"
    r"|(?:\d[\d,]*(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees?)"
    r"|(?:budget|under|below|within|upto|up to|around|max(?:imum)?)"
    r"\s*(?:of\s*)?(?:₹|rs\.?|inr)?\s*\d[\d,]*(?:\.\d+)?",
    re.IGNORECASE,
)

_OWNED_PRODUCT_RE = re.compile(
    r"\b(?:i\s+(?:already\s+)?(?:have|own|use|am using)|i'm\s+using|"
    r"my\s+current)\b"
    r".{0,80}?"
    r"\b(?:product|item|serum|cleanser|moisturizer|moisturiser|sunscreen|"
    r"cream|lotion|toner|face wash|shampoo|conditioner|mask|scrub|oil|gel)\b",
    re.IGNORECASE | re.DOTALL,
)

_CONTEXT_REQUEST_RE = re.compile(
    r"\b(?:recommend\w*|suggest\w*|build|plan|routine|"
    r"what\b.*\bshould i (?:use|add|get|try|buy)|what else should i add|"
    r"best\b.*\bfor|good\b.*\bunder|find\b.*\b(?:under|for))\b",
    re.IGNORECASE | re.DOTALL,
)

_ADD_INTENT_RE = re.compile(
    r"\b(?:i\s+(?:just\s+)?(?:bought|purchased|ordered|got|received)|"
    r"i(?:'m| am)\s+using|i\s+use|"
    r"(?:add|save)\s+(?:this|it|that|these|them)\b|"
    r"(?:add|save)\b[^.]{0,40}\bto\s+(?:my\s+)?inventory)\b",
    re.IGNORECASE | re.DOTALL,
)

_READ_INTENT_RE = re.compile(
    r"\b(?:what|which)\b[^?]{0,60}\b(?:do|did)\s+i\b[^?]{0,20}\b(?:own|have)\b|"
    r"\bwhat'?s\s+in\s+my\s+inventory\b|"
    r"\blist\s+(?:my\s+)?inventory\b|"
    r"\bmy\s+inventory\b|"
    r"\bshow\s+(?:me\s+)?my\s+products\b",
    re.IGNORECASE | re.DOTALL,
)

_REMOVE_INTENT_RE = re.compile(
    r"\b(?:remove|delete|discard|throw away|stop using)\b"
    r".{0,80}?"
    r"\b(?:product|item|inventory|serum|cleanser|moisturizer|moisturiser|"
    r"sunscreen|cream|lotion|toner|face wash|shampoo|conditioner|mask|scrub|"
    r"oil|gel|bottle|tube)\b",
    re.IGNORECASE | re.DOTALL,
)


def needs_user_context(text: str) -> bool:
    """Whether a turn is a recommendation/routine request that needs context."""
    return bool(text and _CONTEXT_REQUEST_RE.search(text))


_KNOWN_INGREDIENTS = (
    "vitamin c",
    "ascorbic acid",
    "niacinamide",
    "salicylic acid",
    "retinol",
    "fragrance",
    "parfum",
    "alcohol",
    "sulfate",
    "paraben",
    "essential oil",
    "citrus",
    "tea tree",
    "benzoyl peroxide",
    "glycolic acid",
    "lactic acid",
)


def _ingredient_patterns(term: str) -> tuple[re.Pattern[str], ...]:
    escaped = re.escape(term)
    return (
        re.compile(
            rf"\b(?:allergic to|sensitive to|avoid|can't use|cannot use|"
            rf"hate|hates|dislike|dislikes|don't want|do not want)\b"
            rf"[^.]{{0,40}}?\b{escaped}\b",
            re.IGNORECASE,
        ),
        re.compile(
            rf"\b{escaped}\b[^.]{{0,40}}?\b(?:causes?|caused|makes?|triggers?|"
            rf"irritates?|gives? me)\b[^.]{{0,80}}?\b(?:redness|red|itch(?:ing)?|"
            rf"swelling|burn(?:ing)?|rash|reaction|irritation)\b",
            re.IGNORECASE,
        ),
        re.compile(rf"\bwithout\s+{escaped}\b", re.IGNORECASE),
        re.compile(rf"\b{escaped}[- ]free\b", re.IGNORECASE),
    )


_INGREDIENT_PATTERNS = {
    term: _ingredient_patterns(term) for term in _KNOWN_INGREDIENTS
}


@dataclass
class GroomContext:
    """Mutable state for one agent run or chat turn sequence."""

    user_id: str
    user_messages: list[str] = field(default_factory=list)
    profile_loaded: bool = False
    memory_loaded: bool = False
    inventory_loaded: bool = False
    search_count: int = 0
    recalled_memory: str = ""
    inventory_items: list[dict] = field(default_factory=list)
    pending_inventory_action: str | None = None

    def add_user_message(self, text: str) -> None:
        if not text:
            return
        self.user_messages.append(text)
        if needs_user_context(text):
            self.pending_inventory_action = None
        elif _REMOVE_INTENT_RE.search(text):
            self.pending_inventory_action = "remove"
        elif _ADD_INTENT_RE.search(text):
            self.pending_inventory_action = "add"
        elif _READ_INTENT_RE.search(text):
            self.pending_inventory_action = "read"

    @property
    def context_loaded(self) -> bool:
        return self.profile_loaded and self.memory_loaded

    def has_explicit_budget(self) -> bool:
        return any(_BUDGET_RE.search(message) for message in self.user_messages)

    def mentions_owned_product(self) -> bool:
        return any(
            _OWNED_PRODUCT_RE.search(message) for message in self.user_messages
        )

    def recommendation_requested(self) -> bool:
        return bool(self.user_messages and needs_user_context(self.user_messages[-1]))

    def add_inventory_intent(self) -> bool:
        return self.pending_inventory_action == "add"

    def read_inventory_intent(self) -> bool:
        return self.pending_inventory_action == "read"

    def remove_inventory_intent(self) -> bool:
        return self.pending_inventory_action == "remove"

    def list_inventory_visible(self) -> bool:
        return bool(
            self.pending_inventory_action in {"read", "remove"}
            or (self.recommendation_requested() and self.mentions_owned_product())
        )

    def excluded_ingredients(self) -> set[str]:
        """Ingredients the user explicitly called out as a problem."""
        text = " ".join([*self.user_messages, self.recalled_memory])
        found: set[str] = set()
        for term, patterns in _INGREDIENT_PATTERNS.items():
            if any(pattern.search(text) for pattern in patterns):
                found.add(term)
        return found

    def can_search(self) -> bool:
        """Allow one focused query plus at most one retry."""
        return self.search_count < 2

    def record_search(self) -> None:
        self.search_count += 1
