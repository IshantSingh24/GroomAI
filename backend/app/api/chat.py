from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner, trace
from openai.types.responses import ResponseTextDeltaEvent
from app.agents.agent import groom_agent
from app.agents.vision_agent import vision_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    image_base64: str | None = None


@router.post("/chat")
async def chat(body: ChatRequest):

    async def stream():

        context = []

        # ---------- Vision Step (NON-STREAMING, CORRECT) ----------
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
                v_result = await Runner.run(vision_agent, vision_input)

            context.append({
                "role": "user",
                "content": f"SKIN ANALYSIS REPORT:\n{v_result.final_output}"
            })

        # ---------- Main Prompt ----------
        context.append({
            "role": "user",
            "content": body.message
        })

        # ---------- STREAMING (OFFICIAL WAY) ----------
        with trace("GroomAI Core"):
            result = Runner.run_streamed(groom_agent, context)

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
