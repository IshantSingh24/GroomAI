import os
import io
import base64
import gradio as gr
from agents import Runner, trace
from agent import main_agent
from memory import read_memory, write_memory

# Constant path for the temporary image
TEMP_IMG_PATH = "temp_face.jpg"

async def run_chat(message, image, history):
    content = []

    # 1. Handle Memory
    if message and message.strip():
        memory_context = read_memory(message)
        if memory_context:
            content.append({
                "type": "input_text",
                "text": f"Memory Context:\n{memory_context}"
            })
        content.append({"type": "input_text", "text": message.strip()})

    # 2. Handle Image
    if image is not None:
        # Save image locally so the Tool can read it
        image = image.convert("RGB")
        image.save(TEMP_IMG_PATH, format="JPEG")

        # Encode image to Base64 so the Main Agent can see it
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        content.append({
            "type": "input_image",
            "image_url": f"data:image/jpeg;base64,{img_base64}"
        })

        # CRITICAL: Tell the Agent exactly where the file is
        content.append({
            "type": "input_text", 
            "text": f"SYSTEM: User uploaded an image saved at '{TEMP_IMG_PATH}'. Call analyze_face with image_url='{TEMP_IMG_PATH}'."
        })

    if not content:
        return history, ""

    # 3. Run Agent with Tracing
    input_data = [{"role": "user", "content": content}]
    
    with trace("GroomAI Interaction"):
        result = await Runner.run(main_agent, input_data)
        
    assistant_reply = result.final_output or "No response generated."

    # 4. Update Memory & History
    if message:
        write_memory(f"User: {message}\nAI: {assistant_reply}")

    history = history + [
        {"role": "user", "content": message or "[Image Uploaded]"},
        {"role": "assistant", "content": assistant_reply}
    ]

    return history, ""

# 5. UI Setup
with gr.Blocks(title="GroomAI") as demo:
    gr.Markdown("## 🧴 GroomAI")
    
    chatbot = gr.Chatbot(height=500, type="messages")
    state = gr.State([])

    with gr.Row():
        txt = gr.Textbox(scale=4, placeholder="Ask about skincare...")
        img = gr.Image(type="pil", scale=1)

    send = gr.Button("Send")
    send.click(run_chat, inputs=[txt, img, state], outputs=[chatbot, txt])

if __name__ == "__main__":
    demo.launch()