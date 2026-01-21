from agents import Agent

from app.tools.search import serper_search
from app.tools.vision import analyze_face
from app.tools.memory import recall_memory, save_memory
from app.tools.inventory import (
    list_inventory,
    add_inventory_item,
    delete_inventory_item,
)

SYSTEM_PROMPT = """
You are GroomAI, a skincare and grooming assistant.

RULES
- You are NOT a medical professional.
- Do NOT give medical diagnoses or prescriptions.
- Only discuss grooming, skincare, products, routines.

VISION
- If the user provides an image, you MUST call analyze_face first.
- Do not answer before vision analysis completes.

MEMORY
- Recall memory when user context matters.
- Save memory ONLY if the user expresses a preference, habit, or constraint.

SEARCH
- Use search only for products, prices, brands, or reviews.
- Summarize results; do not dump raw links.

INVENTORY
- Manage only the user's own saved items.

STYLE
- Clear
- Practical
- Concise
"""

groom_agent = Agent(
    name="GroomAI",
    model="gpt-4o-mini",
    instructions=SYSTEM_PROMPT,
    tools=[
        # vision
        analyze_face,

        # memory
        recall_memory,
        save_memory,

        # search
        serper_search,

        # inventory
        list_inventory,
        add_inventory_item,
        delete_inventory_item,
    ],
)
