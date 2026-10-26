from agents import RunContextWrapper, function_tool
from app.agents.context import GroomContext
from app.memory.profile import load_profile, save_profile


def _profile_enabled(
    ctx: RunContextWrapper[GroomContext],
    agent: object,
) -> bool:
    """Hide profile reads once the current turn already has the context."""
    session = ctx.context
    return session is None or not getattr(session, "profile_loaded", False)


@function_tool(is_enabled=_profile_enabled)
def get_profile(ctx: RunContextWrapper[GroomContext], user_id: str) -> dict:
    """
    Read the user's stored profile, including read-only skin/hair fields.

    Call this before a personalized recommendation and before asking the user
    for information that may already be stored.
    """
    session = ctx.context
    profile = load_profile(user_id)
    if session is not None:
        session.profile_loaded = True
    return profile


@function_tool
def update_profile(user_id: str, key: str, value: str):
    profile = load_profile(user_id)
    profile[key] = value
    save_profile(user_id, profile)
    return "profile updated"
