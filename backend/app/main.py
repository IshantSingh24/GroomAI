from dotenv import load_dotenv
load_dotenv()
from app.api.inventory import router as inventory_router
from fastapi import FastAPI, Depends
from sqlalchemy import text
from app.core.auth import get_current_user
from app.db.session import get_db
from app.api.chat import router as chat_router
from app.api.vision import router as vision_router

app = FastAPI()
app.include_router(inventory_router)
app.include_router(chat_router)
app.include_router(vision_router)




@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-health")
def db_health(db=Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"db": "ok"}

@app.get("/protected")
def protected(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id}
