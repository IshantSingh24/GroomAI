from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner, trace
from openai.types.responses import ResponseTextDeltaEvent

from app.agents.agent import get_groom_agent
from app.agents.vision_agent import vision_agent

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    image_base64: str | None = None


def get_user_id_from_request(request: Request) -> str:
    """
    Extract user_id (gmail) sent from frontend via Clerk.
    """
    email = request.headers.get("x-clerk-user-email")
    if not email:
        raise Exception("User not authenticated")
    return email.strip().lower()


@router.post("/chat")
async def chat(request: Request, body: ChatRequest):

    # 🔹 USER ID = GMAIL
    user_id = get_user_id_from_request(request)

    # 🔹 Agent created per user (SYSTEM PROMPT knows user_id)
    groom_agent = get_groom_agent(user_id)

    async def stream():
        messages = []

        # ---------- Vision Step ----------
        if body.image_base64:
            vision_input = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_image",
                            "image_url": body.image_base64
                        },
                        {
                            "type": "input_text",
                            "text": "Perform a full skin analysis."
                        }
                    ],
                }
            ]

            with trace("Vision Analysis"):
                v_result = await Runner.run(
                    vision_agent,
                    vision_input
                )

            messages.append({
                "role": "user",
                "content": f"SKIN ANALYSIS REPORT:\n{v_result.final_output}"
            })

        # ---------- User Message ----------
        messages.append({
            "role": "user",
            "content": body.message
        })

        # ---------- STREAMING ----------
        with trace("GroomAI Core"):
            result = Runner.run_streamed(
                groom_agent,
                messages
            )

            async for event in result.stream_events():
                if (
                    event.type == "raw_response_event"
                    and isinstance(event.data, ResponseTextDeltaEvent)
                ):
                    yield event.data.delta

    return StreamingResponse(
        stream(),
        media_type="text/plain"
    )
