import os
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field
import base64


# Assuming you import your decorator from your framework
# If you are using a specific library (like LlamaIndex or a custom one), import it here.
# For this example, I will define a dummy or import it from your 'agents' module if it exists.
from agents import function_tool 

load_dotenv()
client = OpenAI()

# 1. Your Data Structure (Schema)
class FaceAnalysis(BaseModel):
    skin_type: str = Field(description="Observed skin type such as oily, dry, normal, combination or unknown")
    skin_type_severity: str = Field(description="How strong the skin type appears: low, medium, high, or unknown")
    ance: str = Field(description="Observed acne level on face: none, low, medium, high, unknown")
    dark_circles: str = Field(description="Visibility of dark circles: none, low, medium, high, unknown")
    verdict: str = Field(description="Any additional visible observations like pigmentation, redness, or uncertainty notes")


def encode_image(image_path):
    """Helper to convert local image to base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

@function_tool
def analyze_face(image_url: str):
    """
    Analyzes the face. 
    Args:
        image_url: The local file path (e.g., 'temp_face.jpg') or a remote URL.
    """
    
    # 1. Handle Local File Path
    final_url = image_url
    if os.path.exists(image_url):
        base64_image = encode_image(image_url)
        final_url = f"data:image/jpeg;base64,{base64_image}"

    # 2. Call the Model
    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini", 
            messages=[
                {"role": "system", "content": "Analyze the face attributes strictly."},
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": "Analyze this face."},
                        {"type": "image_url", "image_url": {"url": final_url}}
                    ]
                }
            ],
            response_format=FaceAnalysis,
        )
        return completion.choices[0].message.parsed
    except Exception as e:
        return f"Error: {str(e)}"