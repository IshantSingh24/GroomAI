from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from app.core.auth import get_current_user
from app.core.config import settings
from app.memory.store import read_memory, write_memory


router = APIRouter(prefix="/chat", tags=["chat"])

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """
You are GroomAI, a skincare and grooming assistant.

RULES:
- You are NOT a medical professional.
- Only answer skincare, grooming, haircare, and product-related questions.
- Do NOT give medical advice.
- Politely refuse anything outside grooming scope.
- Be concise, practical, and clear.
"""

@router.post("")
def chat(
    message: str,
    user_id: str = Depends(get_current_user),
):
    if not message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    past_context = read_memory(user_id, message)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]

    if past_context:
        messages.append({
            "role": "system",
            "content": f"Relevant past context:\n{past_context}"
        })

    messages.append({"role": "user", "content": message})

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    reply = resp.choices[0].message.content

    # write concise memory
    write_memory(
        user_id,
        f"User: {message}\nGroomAI: {reply}"
    )

    return {"reply": reply}

