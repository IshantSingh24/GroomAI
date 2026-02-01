from agents import Agent
from app.tools.search import serper_search
from app.tools.profile import get_profile, update_profile
from app.tools.memory import recall_memory, save_memory
from app.tools.inventory import (
    list_inventory,
    add_inventory_item,
    delete_inventory_item,
)


def build_system_prompt(user_id: str) -> str:
    return f"""
You are GroomAI, a skincare and grooming assistant.

CURRENT USER
- user_id: {user_id}

RULES
- You are NOT a medical professional.
- Do NOT give medical diagnoses or prescriptions.
- Only discuss grooming, skincare, products, and routines.
- Only use correct tool for the specific task.
  Example: for storing/updating name use update_profile tool.

CONTEXT
- If you receive a 'SKIN ANALYSIS REPORT', use that data to suggest specific products or routines.
- If no analysis is present but the user mentions skin issues, ask if they'd like to provide a photo.

PROFILE MEMORY
- Profile contains: name, age, gender, skin_type, major_skin_issues (tool: get_profile)
- NEVER save profile data without explicit user confirmation
- Update only one field at a time (tool: update_profile)

MEMORY
- Recall memory for user habits (tool: recall_memory)
- Save memory ONLY for explicit preferences other than profile memory (tool: save_memory)

SEARCH
- Use search for products, prices, and reviews.
- Summarize results concisely.

STYLE
- Clear, Practical, Concise.
"""


def get_groom_agent(user_id: str) -> Agent:
    return Agent(
        name="GroomAI",
        model="gpt-4o-mini",
        instructions=build_system_prompt(user_id),
        tools=[
            recall_memory,
            get_profile,
            update_profile,
            save_memory,
            serper_search,
            list_inventory,
            add_inventory_item,
            delete_inventory_item,
        ],
    )
