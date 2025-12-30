import os
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

STORE_PATH = "memory_store"

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

# ---- SAFE FAISS INIT ----
if os.path.exists(STORE_PATH):
    memory_db = FAISS.load_local(
        STORE_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )
else:
    # FAISS needs at least one vector to initialize
    memory_db = FAISS.from_texts(
        ["initial memory placeholder"],
        embeddings
    )
    memory_db.save_local(STORE_PATH)


def write_memory(text: str):
    if not text.strip():
        return
    memory_db.add_texts([text])
    memory_db.save_local(STORE_PATH)


def read_memory(query: str, k: int = 3) -> str:
    if not query.strip():
        return ""
    docs = memory_db.similarity_search(query, k=k)
    return "\n".join(d.page_content for d in docs)
