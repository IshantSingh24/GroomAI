# import base64
# import os
# from agents import function_tool
# from openai import OpenAI

# from agents import function_tool
# from openai import OpenAI

# client = OpenAI()

# @function_tool
# def analyze_face(image_url: str) -> str:
#     """Analyze skin attributes from an image URL string."""
#     # This tool creates its own 'mini-response' to analyze the pixels
#     response = client.responses.create(
#         model="gpt-4o-mini",
#         input=[{
#             "role": "user",
#             "content": [
#                 {"type": "input_image", "image_url": image_url},
#                 {"type": "input_text", "text": "Describe skin type and acne."}
#             ]
#         }]
#     )
#     return response.output_text