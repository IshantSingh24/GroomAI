from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner, trace
from app.agents.agent import groom_agent
from app.agents.vision_agent import vision_agent
import asyncio

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    image_base64: str | None = None

@router.post("/chat")
async def chat(body: ChatRequest):

    async def stream():
        context = []

        # ---------- Vision step (blocking, correct) ----------
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
                v = await Runner.run(vision_agent, vision_input)
                report = v.final_output

            context.append({
                "role": "user",
                "content": f"SKIN ANALYSIS REPORT:\n{report}"
            })

        # ---------- User message ----------
        context.append({
            "role": "user",
            "content": body.message
        })

        # ---------- STREAMING ----------
        with trace("GroomAI Core"):
            result = Runner.run(
                groom_agent,
                context,
                stream=True
            )

            async for event in result:
                if event.type == "response.output_text.delta":
                    yield event.delta
                await asyncio.sleep(0)

    return StreamingResponse(stream(), media_type="text/plain")
