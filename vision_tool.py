import os 
from dotenv import load_dotenv
from openai.types import FileObject
from pydantic import BaseModel, Field
from agents import Agent

load_dotenv()

class FaceAnalysis(BaseModel):
    valid: str = Field(description=" True if the image  is of`human face and good quality else False")
    skin_type: str = Field(description ="Observed skin type such as oily, dry, normal, combination or unknown")
    skin_type_severity: str = Field(description="How strong the skin type appears: low, medium, high, or unknown")
    ance: str = Field(description="Observed acne level on face : none, low, medium , high, unknown")
    dark_circles: str = Field(description="visibility of dark circles: none, low, medium, high, unknown")
    verdict: str = Field(description="Any additional visible observations like pigmentation, redness, uneven tone, or uncertainty notes")

vision_agent = Agent(
    name="Face Analysis Agent",
    model = "gpt-5-mini",
    output_type=FaceAnalysis,
    instructions="""
You analyze a user's face image and extract basic skincare-related attributes.

Rules:
- If the image is irrelevant or very poor quality just mark valid as False
   and mark all other fields as none but dont be very picky about only, only if the image is really bad or totally irreelvant.
- Only describe what is visibly observable.
- Do NOT guess age, gender, ethnicity, or medical conditions.
- If unsure, clearly say "unknown".
- Keep descriptions short and factual.
- Use the verdict field for extra observations or uncertainty.
"""
)

vision_tool= vision_agent.as_tool(
    tool_name="analyse_face",
    tool_description="Analayze the image of the face provided by the user and return structured skincare related attributes."
)