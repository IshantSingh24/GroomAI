import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
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

    # We wrap the logic in a generator to handle the streaming response lifecycle
    async def response_generator():
        # Instantiate Runner if it's a class, otherwise use it directly
        # Based on your imports, it looks like a static utility, but we handle both.
        runner = Runner() if isinstance(Runner, type) else Runner

        context = []

        # ---------------------------------------------------------
        # 1. VISION STEP (Must be Awaited)
        # ---------------------------------------------------------
        if body.image_base64:
            vision_input = [
                {
                    "role": "user",
                    "content": [
                        {"type": "input_image", "image_url": body.image_base64},
                        {"type": "input_text", "text": "Perform a full skin analysis."}
                    ],
                }
            ]
            
            # FIX: We MUST await this call. The previous error happened because this was un-awaited.
            # We wrap it in a trace for logging, but we don't rely on trace for data.
            with trace("Vision Analysis"):
                vision_result = await runner.run(vision_agent, vision_input)
            
            # Extract text safely (handling object or dict return types)
            report_text = getattr(vision_result, 'text', str(vision_result))
            
            # Yield the vision status to the user (optional, improves UX)
            yield f"Analyzed Image: {report_text[:50]}...\n\n"
            
            context.append({
                "role": "user",
                "content": f"SKIN ANALYSIS REPORT:\n{report_text}"
            })

        # ---------------------------------------------------------
        # 2. PREPARE CONTEXT
        # ---------------------------------------------------------
        context.append({
            "role": "user",
            "content": body.message
        })

        # ---------------------------------------------------------
        # 3. CHAT STEP (Streaming Handling)
        # ---------------------------------------------------------
        # Since 'trace.events' and 'Runner.stream' failed, we use the standard AWAIT pattern.
        # If your library supports streaming, it likely returns an AsyncGenerator when prompted.
        
        with trace("GroomAI Core"):
            # We await the run. If the library supports streaming via a flag, 
            # you would add `stream=True` here, e.g., await runner.run(..., stream=True)
            response = await runner.run(groom_agent, context)

        # CHECK: Is the response a stream (AsyncGenerator) or a final Result?
        if hasattr(response, '__aiter__'):
            # If it's a stream, yield chunks as they arrive
            async for chunk in response:
                # Adjust 'delta' access based on your specific library's chunk structure
                content = getattr(chunk, 'text', getattr(chunk, 'delta', str(chunk)))
                yield content
        else:
            # If it's a static result (most likely case with default settings),
            # we yield the full text. This prevents the "AttributeError".
            final_text = getattr(response, 'text', str(response))
            yield final_text

    return StreamingResponse(response_generator(), media_type="text/event-stream")

    