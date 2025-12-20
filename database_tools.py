import re
from agents import function_tool
from database import add_item, delete_item, list_items

@function_tool
def add_item_tool (item_name: str, item_price: float, reason: str)->str:
    """ Add an item to the database """
    return add_item(item_name, item_price, reason)

@function_tool
def delete_item_tool(item_name: str) ->str:
    """ Delete an item from the database """
    return delete_item(item_name)

@function_tool
def list_items_tool() -> str:
    """List all stored items"""
    items = list_items()
    if isinstance(items, str):
        return items

    return "\n".join(
        f"{name} | ₹{price} | {reason}"
        for name, price, reason in items
    )