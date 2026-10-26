"""Load profile and memory into the current user turn.

The agent still has explicit ``get_profile`` / ``recall_memory`` tools for
non-recommendation turns. Recommendation and routine turns are preloaded so the
model cannot forget to check stored context before asking the user for it.
"""

from __future__ import annotations

import json

from app.agents.context import GroomContext, needs_user_context
from app.memory.profile import load_profile
from app.memory.store import read_memory


def _format_context(profile: dict, memory: str) -> str:
    profile_text = json.dumps(profile, ensure_ascii=False, sort_keys=True) if profile else "none"
    memory_text = memory.strip() if memory and memory.strip() else "none"
    return (
        "[USER CONTEXT - already loaded; do not ask for these details again]\n"
        f"Profile: {profile_text}\n"
        f"Memory: {memory_text}"
    )


def load_user_context(session: GroomContext, query: str) -> str | None:
    """Return a context block for a recommendation turn, or None.

    Context is only preloaded once a budget is present. A turn without a budget
    should ask for one instead of receiving a product-ready context block; the
    model can still call the context tools on that turn.

    Marks the session as loaded as a side effect, which lets the search gate
    open and hides the now-redundant context tools.
    """
    if not needs_user_context(query):
        return None
    if not session.has_explicit_budget():
        return None

    profile = load_profile(session.user_id)
    memory = read_memory(session.user_id, query) or ""
    session.profile_loaded = True
    session.memory_loaded = True
    session.recalled_memory = memory
    return _format_context(profile, memory)


def prepend_context(turn: str, context_block: str | None) -> str:
    """Put the context before the user's message without changing its meaning."""
    if not context_block:
        return turn
    return f"{context_block}\n\n[User's message]\n{turn}"
