import gradio as gr
import base64
import io

from agents import Runner, trace
from agent import main_agent   # ensure this file exists


async def run_chat(message, image, history):
    """
    Multimodal Gradio chat callback.
    Supports:
    - text only
    - image only
    - text + image
    """

    content = []

    # ---- Text input ----
    if message and message.strip():
        content.append({
            "type": "input_text",
            "text": message.strip()
        })

    # ---- Image input (Responses API format) ----
    if image is not None:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        content.append({
            "type": "input_image",
            "image_url": f"data:image/jpeg;base64,{img_base64}"
        })

    # Nothing to send
    if not content:
        return history, ""

    # ---- Agent SDK expects LIST of messages ----
    input_data = [
        {
            "role": "user",
            "content": content
        }
    ]

    # ---- TRACE CONTEXT (THIS IS WHAT YOU ASKED) ----
    with trace("GroomAI User Interaction"):
        result = await Runner.run(main_agent, input_data)

    assistant_reply = result.final_output or ""

    # ---- Update chat history ----
    history = history + [
        {"role": "user", "content": message or "[Image uploaded]"},
        {"role": "assistant", "content": assistant_reply}
    ]

    return history, ""


# ---------------- UI ----------------

with gr.Blocks(title="GroomAI") as demo:
    gr.Markdown("## 🧴 GroomAI — AI Skincare Advisor")

    chatbot = gr.Chatbot(
        height=420,
        type="messages"
    )

    state = gr.State([])

    with gr.Row():
        txt = gr.Textbox(
            placeholder="Ask anything about skincare...",
            scale=4
        )
        img = gr.Image(
            type="pil",
            scale=1
        )

    send = gr.Button("Send")

    send.click(
        run_chat,
        inputs=[txt, img, state],
        outputs=[chatbot, txt]
    )

demo.launch()
