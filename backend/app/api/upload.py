from fastapi import APIRouter, UploadFile, File
import base64

router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    content = await file.read()
    encoded = base64.b64encode(content).decode("utf-8")

    return {
        "image_base64": f"data:image/jpeg;base64,{encoded}"
    }
