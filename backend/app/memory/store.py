import os
from datetime import datetime, timedelta
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

BASE_PATH = "memory_store"
MAX_MEMORIES_PER_USER = 100          # hard cap — oldest get pruned
SIMILARITY_THRESHOLD = 1.5          # L2 distance; lower = more similar
DEDUP_THRESHOLD = 0.15              # if new text is this close to existing, skip it
MEMORY_TTL_DAYS = 90                # memories older than this are pruned on read

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)


def _user_path(user_id: str) -> str:
    return os.path.join(BASE_PATH, user_id)


def get_user_memory(user_id: str) -> FAISS | None:
    """
    Load a FAISS vector store for a specific user.
    Returns None if no memories exist yet.
    """
    path = _user_path(user_id)
    index_file = os.path.join(path, "index.faiss")

    if not os.path.exists(index_file):
        return None

    return FAISS.load_local(
        path,
        embeddings,
        allow_dangerous_deserialization=True,
    )


def _is_duplicate(db: FAISS, text: str) -> bool:
    """
    Check if a near-identical memory already exists.
    Prevents saving "User has oily skin" ten times.
    """
    results = db.similarity_search_with_score(text, k=1)
    if not results:
        return False
    _, score = results[0]
    return score <= DEDUP_THRESHOLD


def _prune_old_memories(db: FAISS) -> FAISS:
    """
    Remove memories older than MEMORY_TTL_DAYS.
    Returns a new FAISS index without stale entries (or the same one if nothing to prune).
    """
    cutoff = (datetime.now() - timedelta(days=MEMORY_TTL_DAYS)).isoformat()
    all_docs = list(db.docstore._dict.values())

    # keep only docs that are recent OR have no timestamp (legacy)
    fresh_docs = []
    for doc in all_docs:
        saved_at = doc.metadata.get("saved_at", "")
        if not saved_at or saved_at >= cutoff:
            fresh_docs.append(doc)

    if len(fresh_docs) == len(all_docs):
        return db  # nothing to prune

    if not fresh_docs:
        return None  # all expired

    # rebuild index from surviving docs
    texts = [d.page_content for d in fresh_docs]
    metadatas = [d.metadata for d in fresh_docs]
    return FAISS.from_texts(texts, embeddings, metadatas=metadatas)


def _enforce_memory_cap(db: FAISS) -> FAISS:
    """
    If the user has more than MAX_MEMORIES_PER_USER entries,
    drop the oldest ones (by saved_at timestamp).
    """
    all_docs = list(db.docstore._dict.values())
    if len(all_docs) <= MAX_MEMORIES_PER_USER:
        return db

    # sort by timestamp, oldest first; docs without timestamp go first (get pruned)
    all_docs.sort(key=lambda d: d.metadata.get("saved_at", ""))

    keep = all_docs[-MAX_MEMORIES_PER_USER:]
    texts = [d.page_content for d in keep]
    metadatas = [d.metadata for d in keep]
    return FAISS.from_texts(texts, embeddings, metadatas=metadatas)


def write_memory(user_id: str, text: str, category: str = "general"):
    """
    Persist a memory entry for the user with metadata.
    Skips near-duplicates automatically.
    """
    if not text.strip():
        return

    path = _user_path(user_id)
    db = get_user_memory(user_id)

    metadata = {
        "saved_at": datetime.now().isoformat(),
        "category": category,
    }

    # --- first memory ever for this user ---
    if db is None:
        os.makedirs(path, exist_ok=True)
        db = FAISS.from_texts([text], embeddings, metadatas=[metadata])
        db.save_local(path)
        return

    # --- dedup check ---
    if _is_duplicate(db, text):
        return  # silently skip

    # --- add + enforce cap ---
    db.add_texts([text], metadatas=[metadata])
    db = _enforce_memory_cap(db)
    db.save_local(path)


def read_memory(user_id: str, query: str, k: int = 3) -> str:
    """
    Retrieve relevant memory snippets for the user.
    Filters out low-relevance results and prunes expired memories.
    """
    if not query.strip():
        return ""

    db = get_user_memory(user_id)
    if db is None:
        return ""

    # --- prune expired memories ---
    db = _prune_old_memories(db)
    if db is None:
        return ""

    # --- similarity search with score filtering ---
    results = db.similarity_search_with_score(query, k=k)
    relevant = [
        doc for doc, score in results
        if score <= SIMILARITY_THRESHOLD
    ]

    if not relevant:
        return ""

    # sort by timestamp descending (newest first)
    relevant.sort(key=lambda d: d.metadata.get("saved_at", ""), reverse=True)

    # format output with dates so the agent can trust the newest 
    formatted_memories = []
    for d in relevant:
        date_str = d.metadata.get("saved_at", "Unknown Date")[:10]  # Just YYYY-MM-DD
        formatted_memories.append(f"[{date_str}] {d.page_content}")

    return "\n".join(formatted_memories)
