"""
Secure file upload handling: extension/MIME allow-listing, size limits,
random filenames on disk (never trust the client-supplied name for storage).
"""
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}
MAX_UPLOAD_BYTES = settings.max_upload_mb * 1024 * 1024


def validate_upload(file: UploadFile) -> str:
    """Returns the safe extension for this file, or raises 400/415."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: PDF, JPG, PNG.",
        )
    return ALLOWED_MIME_TYPES[file.content_type]


async def save_upload(file: UploadFile, request_id: str) -> tuple[str, int]:
    """Streams the upload to disk under a random name, enforcing the size cap.
    Returns (stored_path, size_bytes)."""
    ext = validate_upload(file)
    upload_root = Path(settings.upload_dir) / request_id
    upload_root.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = upload_root / stored_name

    size = 0
    with open(stored_path, "wb") as out_file:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                out_file.close()
                stored_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds {settings.max_upload_mb}MB limit.",
                )
            out_file.write(chunk)

    return str(stored_path), size
