import os
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

# Base directory where all user memories live
BASE_PATH = "memory_store"

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

def _user_path(user_id: str) -> str:
    return os.path.join(BASE_PATH, user_id)

def get_user_memory(user_id: str) -> FAISS:
    """
    Load or create a FAISS vector store for a specific user.
    """
    path = _user_path(user_id)

    if os.path.exists(path):
        return FAISS.load_local(
            path,
            embeddings,
            allow_dangerous_deserialization=True,
        )

    os.makedirs(path, exist_ok=True)

    # FAISS requires at least one vector initially
    db = FAISS.from_texts(
        ["initial memory"],
        embeddings,
    )
    db.save_local(path)
    return db

def write_memory(user_id: str, text: str):
    """
    Persist a memory entry for the user.
    """
    if not text.strip():
        return

    db = get_user_memory(user_id)
    db.add_texts([text])
    db.save_local(_user_path(user_id))

def read_memory(user_id: str, query: str, k: int = 3) -> str:
    """
    Retrieve relevant memory snippets for the user.
    """
    if not query.strip():
        return ""

    db = get_user_memory(user_id)
    docs = db.similarity_search(query, k=k)
    return "\n".join(d.page_content for d in docs)
