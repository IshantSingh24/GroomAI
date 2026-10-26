from agents import RunContextWrapper, function_tool
from app.agents.context import GroomContext
from app.memory.store import read_memory, write_memory


def _memory_enabled(
    ctx: RunContextWrapper[GroomContext],
    agent: object,
) -> bool:
    """Hide memory reads once the current turn already has the context."""
    session = ctx.context
    return session is None or not getattr(session, "memory_loaded", False)


@function_tool(is_enabled=_memory_enabled)
def recall_memory(
    ctx: RunContextWrapper[GroomContext],
    user_id: str,
    query: str,
) -> str:
    """
    Recall relevant past user context.

    Call this together with get_profile before a personalized recommendation
    or before asking the user for information that may already be remembered.
    """
    session = ctx.context
    result = read_memory(user_id, query)
    if session is not None:
        session.memory_loaded = True
        session.recalled_memory = result or ""
    return result


@function_tool
def save_memory(user_id: str, text: str, category: str = "general") -> str:
    """
    Save important user preferences or context.
    category must be one of: preference, habit, skin_detail, lifestyle, general
    Duplicate memories are automatically skipped.
    """
    write_memory(user_id, text, category=category)
    return "memory saved"
