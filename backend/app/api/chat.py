from datetime import date
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents import Runner, trace
from openai.types.responses import ResponseTextDeltaEvent

from app.agents.agent import get_groom_agent
from app.agents.vision_agent import vision_agent

router = APIRouter()


class ChatMessageHistory(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    image_base64: str | None = None
    history: list[ChatMessageHistory] = []
    # session_id lets the frontend pass a stable ID per chat session so that
    # all traces from the same conversation are linked together in the
    # OpenAI traces dashboard via group_id.
    session_id: str | None = None


def get_user_id_from_request(request: Request) -> str:
    """
    Extract user_id (gmail) sent from frontend via Clerk.
    """
    email = request.headers.get("x-user-email")
    if not email:
        raise Exception("User not authenticated")
    return email.strip().lower()


@router.post("/chat")
async def chat(request: Request, body: ChatRequest):

    # 🔹 USER ID = GMAIL
    user_id = get_user_id_from_request(request)

    # 🔹 Singleton agent — user_id injected as SESSION CONTEXT in message, not system prompt
    groom_agent = get_groom_agent()

    async def stream():
        messages = []

        # ---------- TRACING — single top-level trace per request ----------
        # workflow_name  : shown as the trace name in platform.openai.com/traces
        # group_id       : links every trace from the same chat session together
        #                  so you can view the full conversation in one place.
        # metadata       : arbitrary dict attached to the trace for filtering.
        #
        # Child spans ("Vision Analysis", "GroomAI Core") nest inside this
        # trace automatically because the SDK uses context-var inheritance.
        with trace(
            "GroomAI Chat",
            group_id=body.session_id,
            metadata={
                "user_id": user_id,
                "has_image": "true" if body.image_base64 else "false",
            },
        ):

            # ---------- SESSION CONTEXT INJECTION ----------
            # Provides today's date and user_id to the agent without embedding them
            # in the static system prompt — preserving OpenAI prompt cache hits.
            # The system prompt explicitly instructs the LLM to extract these values
            # and pass user_id to every tool that requires it.
            messages.append({
                "role": "user",
                "content": f"[SESSION CONTEXT]\nDate: {date.today().isoformat()}\nUser ID: {user_id}"
            })
            messages.append({
                "role": "assistant",
                "content": "Understood. I have your session context — date and user ID noted."
            })

            # ---------- Short-Term Memory Queue ----------
            # Only keep the last 5 messages in context
            for msg in body.history[-5:]:
                sys_role = "assistant" if msg.role == "ai" else "user"
                messages.append({"role": sys_role, "content": msg.text})

            # ---------- Vision Step + User Message ----------
            # If image is present, run vision agent first, then MERGE the report and
            # the user's text into a SINGLE user message.
            # This prevents two consecutive user messages (report + question),
            # which causes the main agent to misattribute or ignore the report.
            if body.image_base64:
                vision_input = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": "Perform a full skin analysis."
                            },
                            {
                                "type": "input_image",
                                "image_url": body.image_base64
                            }
                        ],
                    }
                ]

                # Child span — nested inside the top-level "GroomAI Chat" trace
                with trace("Vision Analysis"):
                    v_result = await Runner.run(
                        vision_agent,
                        vision_input
                    )

                vision_report = v_result.final_output or "Skin analysis inconclusive — image may be unclear."

                # Merge vision report + user's actual text into one user turn
                combined = f"[SKIN ANALYSIS REPORT — from uploaded photo]\n{vision_report}"
                if body.message.strip():
                    combined += f"\n\n[User's message]: {body.message}"

                messages.append({"role": "user", "content": combined})

            else:
                # Text-only: just append the user message directly
                messages.append({"role": "user", "content": body.message})

            # ---------- STREAMING — child span inside same trace ----------
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
