from dotenv import load_dotenv
load_dotenv()  # MUST be first

from fastapi import FastAPI, Depends
from app.core.auth import get_current_user
from app.db.session import get_db


app = FastAPI()

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
