from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from fastapi.staticfiles import StaticFiles
from app.api.upload import router as upload_router
from app.api import inventory, profile




app = FastAPI()
app.include_router(inventory.router)
app.include_router(profile.router)

app.include_router(upload_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://groom-ai-three.vercel.app","https://groom-ai-ishantsingh24s-projects.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
