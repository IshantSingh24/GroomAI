from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import Item

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_user_id(request: Request) -> str:
    email = request.headers.get("x-clerk-user-email")
    if not email:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return email.strip().lower()


@router.get("/")
def list_inventory(request: Request):
    user_id = get_user_id(request)

    db: Session = SessionLocal()
    try:
        items = (
            db.query(Item)
            .filter(Item.user_id == user_id)
            .all()
        )

        return [
            {
                "id": i.id,
                "item_name": i.item_name,
                "item_price": i.item_price,
                "reason": i.reason,
            }
            for i in items
        ]
    finally:
        db.close()
