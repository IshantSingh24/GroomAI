from agents import function_tool
from app.memory.store import read_memory, write_memory


@function_tool
def recall_memory(user_id: str, query: str) -> str:
    """
    Recall relevant past user context.
    """
    return read_memory(user_id, query)


@function_tool
def save_memory(user_id: str, text: str):
    """
    Save important user preferences or context.
    """
    write_memory(user_id, text)
    return "memory saved"
