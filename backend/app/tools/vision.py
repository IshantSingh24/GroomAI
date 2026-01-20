from agents import function_tool
from openai import OpenAI
from pydantic import BaseModel, Field
import base64
import os

client = OpenAI()

class FaceAnalysis(BaseModel):
    skin_type: str = Field(description="oily, dry, normal, combination, unknown")
    skin_type_severity: str = Field(description="low, medium, high, unknown")
    acne: str = Field(description="none, low, medium, high, unknown")
    dark_circles: str = Field(description="none, low, medium, high, unknown")
    verdict: str = Field(description="Other visible observations or uncertainty notes")

def _encode_image(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

@function_tool
def analyze_face(image_url: str) -> FaceAnalysis:
    """
    Analyze visible facial skin attributes.
    Accepts a base64 data URL OR a local file path.
    """

    final_url = image_url
    if os.path.exists(image_url):
        final_url = f"data:image/jpeg;base64,{_encode_image(image_url)}"

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Analyze only visible facial skin attributes. "
                    "Do not guess medical conditions. "
                    "If unsure, say unknown. "
                    "Return structured data only."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this face."},
                    {
                        "type": "image_url",
                        "image_url": {"url": final_url},
                    },
                ],
            },
        ],
        response_format=FaceAnalysis,
    )

    return completion.choices[0].message.parsed
