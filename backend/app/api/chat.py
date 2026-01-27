import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner, trace
from app.agents.agent import groom_agent
from app.agents.vision_agent import vision_agent

router = APIRouter()
# Create a thread pool to handle blocking agent calls without freezing the event loop
executor = ThreadPoolExecutor(max_workers=10)

class ChatRequest(BaseModel):
    message: str
    image_base64: str | None = None

@router.post("/chat")
async def chat(body: ChatRequest):
    loop = asyncio.get_event_loop()

    async def stream():
        context = []

        # ---------- 1. Vision Analysis (Non-blocking) ----------
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

            # We run the blocking Runner.run in a separate thread
            with trace("Vision Analysis") as vt:
                await loop.run_in_executor(executor, Runner.run, vision_agent, vision_input)
                
                analysis_report = "".join(
                    [e.delta for e in vt.events() if e.type == "response.output_text.delta"]
                )

            context.append({
                "role": "user",
                "content": f"SKIN ANALYSIS REPORT:\n{analysis_report}"
            })

        # ---------- 2. User Message ----------
        context.append({
            "role": "user",
            "content": body.message
        })

        # ---------- 3. True Real-Time Streaming ----------
        with trace("GroomAI Core") as t:
            # Start the main agent in a background thread
            run_task = loop.run_in_executor(executor, Runner.run, groom_agent, context)

            # We iterate through events as they are generated. 
            # Note: Ensure t.events() supports live iteration.
            # If t.events() is a list, you must use a callback or async generator.
            
            last_idx = 0
            while not run_task.done():
                events = list(t.events())  # Capture current snapshot of events
                for i in range(last_idx, len(events)):
                    event = events[i]
                    if event.type == "response.output_text.delta":
                        yield event.delta
                last_idx = len(events)
                await asyncio.sleep(0.05) # Yield control back to loop

            # Final check for any remaining events after task completion
            events = list(t.events())
            for i in range(last_idx, len(events)):
                if events[i].type == "response.output_text.delta":
                    yield events[i].delta

    # Use "text/event-stream" for LLM responses
    return StreamingResponse(stream(), media_type="text/event-stream")