import os
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

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
    index_file = os.path.join(path, "index.faiss")

    # ✅ First-time user
    if not os.path.exists(index_file):
        os.makedirs(path, exist_ok=True)

        db = FAISS.from_texts(
            ["initial memory"],
            embeddings,
        )
        db.save_local(path)
        return db

    # ✅ Existing user
    return FAISS.load_local(
        path,
        embeddings,
        allow_dangerous_deserialization=True,
    )


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
