from fastapi import APIRouter
from pydantic import BaseModel
from agents import Runner, trace

from app.agents.agent import groom_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    image_url: str | None = None

@router.post("/chat")
async def chat(payload: ChatRequest):
    class DummyUser:
        id = "test-user"

    user = DummyUser()

    input_message = payload.message

    if payload.image_url:
        input_message = (
            f"{payload.message}\n"
            f"Image: {payload.image_url}"
        )

    # 🔍 TRACE ENABLED
    with trace("GroomAI Interaction"):
        result = await Runner.run(
            groom_agent,
            input_message,
            context={"user_id": user.id},
        )

    # Safe output extraction
    if hasattr(result, "output_text"):
        output = result.output_text
    elif hasattr(result, "final_output"):
        output = result.final_output
    else:
        output = str(result)

    return {"response": output}
