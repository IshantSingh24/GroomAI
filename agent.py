import os
from dotenv import load_dotenv
from agents import Agent

from database_tools import (
    add_item_tool,
    delete_item_tool,
    list_items_tool
)

load_dotenv()

# 🔹 Bind OpenAI model explicitly


agent = Agent(
    name="Database Agent",
    instructions="""
You manage a personal items database.

Rules:
- If user wants to add an item → use add_item_tool
- If user wants to delete an item → use delete_item_tool
- If user wants to list items → use list_items_tool

Always use tools when required.
""",
    model="gpt-4o-mini",
    tools=[
        add_item_tool,
        delete_item_tool,
        list_items_tool
    ]
)
