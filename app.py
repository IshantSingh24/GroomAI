import gradio as gr
import base64
import io

from agents import Runner, trace
from agent import main_agent
from memory import read_memory, write_memory


async def run_chat(message, image, history):
    """
    Multimodal Gradio chat callback with RAG memory.
    """

    content = []

    # ---------------- MEMORY RETRIEVAL ----------------
    if message and message.strip():
        memory_context = read_memory(message)

        if memory_context:
            content.append({
                "type": "input_text",
                "text": f"Relevant past conversation:\n{memory_context}"
            })

        content.append({
            "type": "input_text",
            "text": message.strip()
        })

    # ---------------- IMAGE INPUT ----------------
    if image is not None:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        content.append({
            "type": "input_image",
            "image_url": f"data:image/jpeg;base64,{img_base64}"
        })

    if not content:
        return history, ""

    # ---------------- AGENT INPUT ----------------
    input_data = [
        {
            "role": "user",
            "content": content
        }
    ]
    if image is not None:
        input_data.insert(0, {
            "role": "system",
            "content": "The user has uploaded a face image. You MUST call analyse_face before responding."
     })
    # ---------------- RUN AGENT ----------------
    with trace("GroomAI Interaction"):
        result = await Runner.run(main_agent, input_data)

    assistant_reply = result.final_output or ""

    # ---------------- WRITE MEMORY ----------------
    if message:
        write_memory(f"User: {message}\nAssistant: {assistant_reply}")

    # ---------------- UPDATE UI ----------------
    history = history + [
        {"role": "user", "content": message or "[Image uploaded]"},
        {"role": "assistant", "content": assistant_reply}
    ]

    return history, ""


# ================= UI =================

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
