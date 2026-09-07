# 🧠 GroomAI — Your Personal Skincare & Grooming Advisor

A private, AI-powered skincare advisor that **remembers you**, analyzes your skin from photos, tracks your products, and gives honest, budget-aware recommendations tailored for Indian users.

> GroomAI is **not** a doctor. No diagnosis, no prescriptions — just a smart, judgment-free grooming companion.

---

## ✨ What Makes It Different

| Feature | How It Works |
|---|---|
| **Long-Term Memory** | FAISS vector store per user — preferences, habits, and skin details persist across sessions with auto-dedup and 90-day TTL |
| **Vision Skin Analysis** | Upload a selfie → a dedicated Vision Agent (GPT-4o-mini) returns a structured report: skin type, acne level, dark circles, texture |
| **Product Inventory** | Tracks products you already own (PostgreSQL) so the AI builds routines around them instead of recommending duplicates |
| **Budget-Aware Search** | Asks your budget first, then searches real products via Serper API with prices in ₹ and explains *why* each is recommended |
| **Prompt Caching** | Static system prompt + singleton agent = OpenAI's automatic prompt caching kicks in across all users, cutting ~50% token costs and reducing latency |
| **Streaming Responses** | Real-time token streaming via SSE — responses feel instant |
| **Per-User Isolation** | Every user gets isolated memory, profile, and inventory — no data leakage |

---

## 🏗️ Architecture

```
┌─────────────────────────┐
│   Next.js Frontend      │  ← Auth UI, Chat, Image Upload
│   (Port 3000)           │
└────────┬────────────────┘
         │ HTTP + JWT
┌────────▼────────────────┐
│   FastAPI Backend       │  ← REST API + Streaming Chat
│   (Port 8000)           │
│                         │
│  ┌─ GroomAI Agent ────┐ │
│  │  GPT-4o-mini       │ │  ← Singleton, static prompt (cache-friendly)
│  │  8 function tools   │ │
│  └─────────────────────┘ │
│  ┌─ Vision Agent ─────┐ │
│  │  GPT-4o-mini       │ │  ← Image → structured skin report
│  └─────────────────────┘ │
└────────┬────────────────┘
         │
    ┌────▼─────┐   ┌──────────────┐
    │ Postgres │   │ FAISS + JSON │
    │ (Users,  │   │ (Memory,     │
    │  Items)  │   │  Profiles)   │
    └──────────┘   └──────────────┘
```

### Agent Tools

The GroomAI agent has 8 function tools it can call autonomously:

- `recall_memory` / `save_memory` — semantic search over per-user FAISS vector store
- `get_profile` / `update_profile` — JSON-based user profile (name, age, gender)
- `list_inventory` / `add_inventory_item` / `delete_inventory_item` — PostgreSQL product inventory
- `serper_search` — live Google search for product recommendations

---

## 🔐 Authentication

Custom JWT auth (no third-party dependency):

- **Register/Login** → bcrypt password hashing → JWT token (HS256, 7-day expiry)
- **Frontend** stores token in cookie (`groomai_token`)
- **Middleware** protects routes — unauthenticated users are redirected to `/sign-in`
- User email is passed to the backend via `x-user-email` header on every request

---

## ⚡ Prompt Caching Strategy

OpenAI automatically caches prompt prefixes when they stay identical across requests. GroomAI exploits this:

1. **Static system prompt** — no dynamic values (no user ID, no date) baked into the instructions
2. **Singleton agent** — built once at import time, reused for every user and every request
3. **Session context injection** — dynamic values (date, user ID) are injected as the first user message in the conversation, *after* the cached system prompt

**Result**: ~50% reduction in input token costs and lower latency for all users.

---

## 🐳 Local Development (Docker)

The full stack runs with a single command:

```bash
# 1. Clone and configure
git clone https://github.com/IshantSingh24/GroomAI.git
cd GroomAI
cp .env.example .env
# Edit .env → add your OPENAI_API_KEY and SERPER_API_KEY

# 2. Start everything
docker compose up --build
```

This starts:

| Service | URL | Live Reload |
|---|---|---|
| Next.js frontend | `http://localhost:3000` | ✅ Source mounted |
| FastAPI backend | `http://localhost:8000` | ✅ `--reload` + source mounted |
| PostgreSQL 16 | Internal (port 5432) | — |

Code changes in `backend/` or `frontend/` reflect instantly without rebuilding.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | Powers the AI agents and embeddings |
| `JWT_SECRET` | ✅ | Signs JWT tokens — use a long random string |
| `SERPER_API_KEY` | For search | Enables live product search via Google Serper |
| `DATABASE_URL` | Auto-set | Docker Compose sets this automatically |

---

## 🚀 Deployment

- **Backend** → [Render](https://render.com) (configured via `render.yaml`)
- **Frontend** → [Vercel](https://vercel.com) (standard Next.js deployment)
- **Database** → Render managed PostgreSQL (injected via `DATABASE_URL`)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TailwindCSS |
| Backend | FastAPI, Uvicorn, Python 3.12 |
| AI | OpenAI Agents SDK, GPT-4o-mini, text-embedding-3-small |
| Memory | FAISS (vector), JSON (profiles) |
| Database | PostgreSQL 16 (users, inventory) |
| Auth | JWT (python-jose) + bcrypt |
| Search | Google Serper API |
| Infra | Docker Compose (local), Render + Vercel (prod) |

---

## ⚠️ Disclaimer

GroomAI is an **informed advisor**, not a medical professional. It does not diagnose conditions, prescribe treatments, or replace dermatologist consultations. If a concern seems serious, it will advise you to see a specialist.
