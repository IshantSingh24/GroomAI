from fastapi import APIRouter
from pydantic import BaseModel
from agents import Runner, trace
from app.agents.agent import groom_agent
from app.agents.vision_agent import vision_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    image_base64: str | None = None

@router.post("/chat")
async def chat(body: ChatRequest):
    context = []

    # 1. Vision step (ONLY change is base64 instead of URL)
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
            analysis_report = v_result.final_output

        context.append({
            "role": "user",
            "content": f"SKIN ANALYSIS REPORT:\n{analysis_report}"
        })

    # 2. Main agent
    context.append({
        "role": "user",
        "content": body.message
    })

    with trace("GroomAI Core"):
        result = await Runner.run(groom_agent, context)

    return {
        "response": result.final_output
    }
