from agents import RunContextWrapper, function_tool
import re
import requests
import os

from app.agents.context import GroomContext


def _search_enabled(
    ctx: RunContextWrapper[GroomContext],
    agent: object,
) -> bool:
    """Hide search until context, budget, inventory, and retry limits allow it."""
    session = ctx.context
    if session is None:
        return False
    if not getattr(session, "context_loaded", False):
        return False
    if not getattr(session, "has_explicit_budget", lambda: False)():
        return False
    if (
        getattr(session, "mentions_owned_product", lambda: False)()
        and not getattr(session, "inventory_loaded", False)
    ):
        return False
    return bool(getattr(session, "can_search", lambda: True)())


_OWNED_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "skin",
    "face",
    "serum",
    "cleanser",
    "moisturizer",
    "moisturiser",
    "sunscreen",
    "cream",
    "lotion",
    "toner",
    "wash",
    "product",
    "item",
    "care",
    "co",
    "30ml",
    "50ml",
    "100ml",
    "30g",
    "50g",
    "100g",
}


def _words(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) >= 3 and token not in _OWNED_STOPWORDS
    }


def _matches_owned_product(text: str, owned_names: list[str]) -> bool:
    text_words = _words(text)
    for name in owned_names:
        name_words = _words(name)
        if len(name_words) >= 2 and name_words <= text_words:
            return True
    return False


def _violates_ingredient(text: str, term: str) -> bool:
    lowered = text.lower()
    if term == "fragrance" and (
        "contains fragrance" in lowered or "with fragrance" in lowered
    ):
        return True
    if f"{term}-free" in lowered or f"{term} free" in lowered:
        return False
    return term in lowered


def _filter_results(
    organic: list[dict],
    session: GroomContext,
) -> list[dict]:
    excluded = session.excluded_ingredients()
    owned_names = [
        str(item.get("item_name", ""))
        for item in getattr(session, "inventory_items", [])
        if item.get("item_name")
    ]
    filtered: list[dict] = []
    for item in organic:
        text = f"{item.get('title', '')} {item.get('snippet', '')}"
        if any(_violates_ingredient(text, term) for term in excluded):
            continue
        if _matches_owned_product(text, owned_names):
            continue
        filtered.append(item)
    return filtered


@function_tool(is_enabled=_search_enabled)
def serper_search(ctx: RunContextWrapper[GroomContext], query: str) -> list:
    """
    Search Indian grooming products, prices (INR / Rs), and price comparisons
    on Indian e-commerce platforms like Buyhatke (preferred for cross-platform price comparisons),
    Amazon India, Flipkart, etc. using Google Serper.

    Only available after profile/memory context is loaded, the user has stated
    a budget, and any mentioned owned products have been listed.
    """
    session = ctx.context
    if session is None:
        raise RuntimeError(
            "SESSION_CONTEXT_REQUIRED: no GroomContext was supplied to the run."
        )
    if not getattr(session, "context_loaded", False):
        raise RuntimeError(
            "CONTEXT_REQUIRED: call get_profile and recall_memory before searching."
        )
    if not getattr(session, "has_explicit_budget", lambda: False)():
        raise RuntimeError(
            "BUDGET_REQUIRED: ask the user for an explicit budget before searching."
        )
    if (
        getattr(session, "mentions_owned_product", lambda: False)()
        and not getattr(session, "inventory_loaded", False)
    ):
        raise RuntimeError(
            "INVENTORY_REQUIRED: call list_inventory before searching when the "
            "user mentions a product they already own."
        )
    if not getattr(session, "can_search", lambda: True)():
        raise RuntimeError(
            "SEARCH_LIMIT_REACHED: do not search again. Answer with the results "
            "already available or tell the user no match was found."
        )

    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        raise RuntimeError("SERPER_API_KEY not set")

    session.record_search()

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "q": query,
        "gl": "in",
        "hl": "en",
        "num": 5,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=10)
    r.raise_for_status()

    organic = r.json().get("organic", [])
    filtered = _filter_results(organic, session)
    if not filtered:
        raise RuntimeError(
            "NO_RESULTS: no matching products were found after applying the "
            "user's budget, allergy, preference, and owned-product filters. "
            "Do not invent products or prices. Tell the user no results matched "
            "and suggest a higher budget or broader criteria."
        )

    return [
        {
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "snippet": item.get("snippet", ""),
        }
        for item in filtered
    ]
