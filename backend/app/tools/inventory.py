from agents import function_tool
from app.db.models import Item
from app.db.session import SessionLocal

@function_tool
def list_inventory(user_id: str) -> list:
    """
    List all inventory items for the user.
    """
    db = SessionLocal()
    try:
        items = db.query(Item).filter(Item.user_id == user_id).all()
        return [
            {
                "item_name": i.item_name,
                "item_price": i.item_price,
                "reason": i.reason,
            }
            for i in items
        ]
    finally:
        db.close()

@function_tool
def add_inventory_item(
    user_id: str,
    item_name: str,
    item_price: float,
    reason: str,
):
    """
    Add an item to user's inventory.
    """
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
        return "item added"
    finally:
        db.close()

@function_tool
def delete_inventory_item(user_id: str, item_name: str):
    """
    Delete an item from user's inventory.
    """
    db = SessionLocal()
    try:
        db.query(Item).filter(
            Item.user_id == user_id,
            Item.item_name == item_name,
        ).delete()
        db.commit()
        return "item deleted"
    finally:
        db.close()
