import os
from dotenv import load_dotenv
from agents import Agent

from vision_tool import vision_tool
from web_search_tool import serper_search
from database_tools import (
    add_item_tool,
    delete_item_tool,
    list_items_tool
)

load_dotenv()

main_agent = Agent(
    name="Main Agent",
    model="gpt-5-mini",
    instructions="""
You are GroomAI, a skincare advisor AI.

RULES
- You are NOT a medical professional.
- Only answer skincare, grooming, and product-related queries.
- Politely refuse anything outside this scope.

VISION
- If an image is provided, use analyze_face.
- Call analyze face and provide it the image.
- Only reply after getting skin analysis data from teh analyze tool.

PRODUCTS
- Use serper_search for prices.
- Recommend trusted brands within budget.
- Do NOT suggest prescription treatments.

INVENTORY
- Use database tools to add, list, or delete products.

STYLE
- Clear, practical, concise.
""",
    tools=[
        vision_tool,
        serper_search,
        add_item_tool,
        delete_item_tool,
        list_items_tool
    ]
)
