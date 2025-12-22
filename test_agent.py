from agents import Runner
from agent import main_agent
import base64

def run(prompt, image_path=None):
    print("\nUSER:", prompt)

    input_data = prompt

    if image_path:
        with open(image_path, "rb") as f:
            img_base64 = base64.b64encode(f.read()).decode()
        input_data = {
            "input": prompt,
            "image": img_base64
        }

    result = Runner.run_sync(main_agent, input_data)
    print("AGENT OUTPUT:\n", result.final_output)


if __name__ == "__main__":

    # 1️⃣ TEST WEB SEARCH TOOL
    run("Search price of Cetaphil cleanser in India")

    # 2️⃣ TEST DATABASE TOOL (ADD + LIST)
    run("Add Cetaphil cleanser for daily face wash")
    run("List all items in my database")

    # 3️⃣ TEST DATABASE TOOL (DELETE)
    run("Delete Cetaphil cleanser")
    run("List all items")

    # 4️⃣ TEST VISION TOOL (OPTIONAL IMAGE)
    # Put a face image path here
    # run("Analyze my face", image_path="face.jpg")
