import base64
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.face_gate import has_face

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Receive an image upload, run a local face-detection gate (MediaPipe BlazeFace),
    and only proceed if a human face is found.

    Gate cost  : ~10 ms, free, runs on CPU.
    On no-face : returns 422 immediately — Vision LLM is never called.
    On face    : returns base64-encoded image for the Vision agent.
    """
    content = await file.read()

    # ── Face gate ─────────────────────────────────────────────────────────────
    # Check for a human face before doing anything expensive.
    if not has_face(content):
        logger.info("[upload] Face gate rejected upload: no face detected in %s", file.filename)
        raise HTTPException(
            status_code=422,
            detail=(
                "No face detected in the uploaded image. "
                "Please upload a clear photo of your face for skin analysis."
            ),
        )

    logger.info("[upload] Face gate passed for %s — proceeding to encode", file.filename)

    # ── Encode to base64 data URL ──────────────────────────────────────────────
    mime = file.content_type or "image/jpeg"
    encoded = base64.b64encode(content).decode("utf-8")

    return {"image_base64": f"data:{mime};base64,{encoded}"}
