"""
face_gate.py — Local MediaPipe BlazeFace detector used as a cost-saving gate.

Before calling the expensive Vision LLM (gpt-4o-mini), every uploaded image
passes through this lightweight local check (~5-15ms, CPU-only, free).

If no human face is detected the upload endpoint returns a 422 error immediately,
avoiding the OpenAI API call entirely.

Model: BlazeFace short-range (frontal selfie-optimised)
Size:  ~225 KB  |  Latency: 5-15 ms/image on CPU
"""

import pathlib
import logging
import numpy as np
import cv2
import mediapipe as mp

logger = logging.getLogger(__name__)

# ── Model path (bundled with backend) ─────────────────────────────────────────
_MODEL_PATH = pathlib.Path(__file__).parent / "models" / "blaze_face_short_range.tflite"

# ── Detection confidence threshold ────────────────────────────────────────────
# 0.5 = balanced; lower → fewer misses but more false positives
MIN_FACE_CONFIDENCE: float = 0.5

# ── Singleton detector (loaded once at module import) ─────────────────────────
# Creating the TFLite interpreter is slow (~200ms). We do it once at startup
# so every subsequent request pays only the ~10ms inference cost.
_BaseOptions        = mp.tasks.BaseOptions
_FaceDetector       = mp.tasks.vision.FaceDetector
_FaceDetectorOptions = mp.tasks.vision.FaceDetectorOptions
_RunningMode        = mp.tasks.vision.RunningMode

_options = _FaceDetectorOptions(
    base_options=_BaseOptions(model_asset_path=str(_MODEL_PATH)),
    running_mode=_RunningMode.IMAGE,
    min_detection_confidence=MIN_FACE_CONFIDENCE,
)

# Global detector instance — re-used across all requests
_detector: _FaceDetector | None = None


def _get_detector() -> _FaceDetector:
    """Return (and lazily create) the singleton FaceDetector."""
    global _detector
    if _detector is None:
        logger.info("[face_gate] Loading BlazeFace model from %s", _MODEL_PATH)
        _detector = _FaceDetector.create_from_options(_options)
        logger.info("[face_gate] BlazeFace model loaded OK")
    return _detector


def has_face(image_bytes: bytes) -> bool:
    """
    Return True if at least one human face is detected in the image.

    Args:
        image_bytes: Raw bytes of the uploaded image (any OpenCV-readable format).

    Returns:
        True  — face found, proceed to Vision LLM.
        False — no face, reject the upload early.
    """
    try:
        img_array = np.frombuffer(image_bytes, np.uint8)
        img_bgr   = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img_bgr is None:
            logger.warning("[face_gate] Could not decode image bytes")
            return False

        img_rgb  = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

        result = _get_detector().detect(mp_image)
        return bool(result.detections)

    except Exception:
        logger.exception("[face_gate] Unexpected error during face detection")
        # On any unexpected error, fail-open: let the image through.
        # Better to occasionally call Vision LLM than to block valid uploads.
        return True
