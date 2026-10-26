from agents import RunContextWrapper, function_tool

from app.agents.context import GroomContext
from app.db.models import Item
from app.db.session import SessionLocal


def _list_enabled(
    ctx: RunContextWrapper[GroomContext],
    agent: object,
) -> bool:
    """Expose listing only for read/remove flows or owned-product recs."""
    session = ctx.context
    return session is None or session.list_inventory_visible()


def _add_enabled(
    ctx: RunContextWrapper[GroomContext],
    agent: object,
) -> bool:
    """Expose add only when the user says they bought/use a product."""
    session = ctx.context
    return session is None or session.add_inventory_intent()


def _delete_enabled(
    ctx: RunContextWrapper[GroomContext],
    agent: object,
) -> bool:
    """Only expose delete when the user explicitly asks to remove something."""
    session = ctx.context
    return session is None or session.remove_inventory_intent()


@function_tool(is_enabled=_list_enabled)
def list_inventory(ctx: RunContextWrapper[GroomContext], user_id: str) -> list:
    """
    List all products the user owns.

    Use this for pure inventory questions and for recommendation flows where
    the user mentions an owned product. In an add flow, call
    add_inventory_item directly instead of listing first.
    """
    db = SessionLocal()
    try:
        items = db.query(Item).filter(Item.user_id == user_id).all()
        payload = [
            {
                "item_name": i.item_name,
                "item_price": i.item_price,
                "reason": i.reason,
            }
            for i in items
        ]
        session = ctx.context
        if session is not None:
            session.inventory_loaded = True
            session.inventory_items = payload
            if session.pending_inventory_action == "read":
                session.pending_inventory_action = None
        return payload
    finally:
        db.close()

@function_tool(is_enabled=_add_enabled)
def add_inventory_item(
    ctx: RunContextWrapper[GroomContext],
    user_id: str,
    item_name: str,
    item_price: float,
    reason: str,
):
    """
    Add a product the user says they bought, own, or use.

    This is the only inventory tool needed for an add flow. Do not list or
    delete inventory before calling this tool.
    """
    session = ctx.context
    if session is not None and not session.add_inventory_intent():
        raise RuntimeError(
            "ADD_NOT_REQUESTED: the user did not say they bought or use a product."
        )
    db = SessionLocal()
    try:
        item = Item(
            user_id=user_id,
            item_name=item_name,
            item_price=item_price,
            reason=reason,
        )
        db.add(item)
        db.commit()
        if session is not None:
            session.pending_inventory_action = None
        return "item added"
    finally:
        db.close()

@function_tool(is_enabled=_delete_enabled)
def delete_inventory_item(
    ctx: RunContextWrapper[GroomContext],
    user_id: str,
    item_name: str,
):
    """
    Remove a product only when the user explicitly asks to remove/delete it.

    Never call this in an add or recommendation flow. If the product name is
    ambiguous, call list_inventory once first, then delete the matching item.
    """
    if not _delete_enabled(ctx, None):
        raise RuntimeError(
            "DELETE_NOT_REQUESTED: the user did not explicitly ask to remove a product."
        )
    db = SessionLocal()
    try:
        deleted = (
            db.query(Item)
            .filter(
                Item.user_id == user_id,
                Item.item_name == item_name,
            )
            .delete()
        )
        db.commit()
        if deleted == 0:
            return "item not found; inventory unchanged"
        session = ctx.context
        if session is not None:
            session.pending_inventory_action = None
        return "item deleted"
    finally:
        db.close()
