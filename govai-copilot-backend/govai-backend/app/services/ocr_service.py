"""
OCR extraction using Tesseract (via pytesseract), plus lightweight regex-based
field identification (name, DOB, Aadhaar, address, document number).

Swap-out point: to move to PaddleOCR/EasyOCR later, only `extract_text()`
needs to change — `extract_fields()` operates on plain text and is
engine-agnostic.
"""
import re
from pathlib import Path

import pytesseract
from PIL import Image

from app.core.config import settings

pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

_AADHAAR_RE = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
_DOB_RE = re.compile(r"\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\b")
_DOC_NUMBER_RE = re.compile(r"\b[A-Z]{2,5}[- ]?\d{4,12}\b")
_NAME_LINE_RE = re.compile(r"(?:name|नाम)\s*[:\-]?\s*(.+)", re.IGNORECASE)
_ADDRESS_LINE_RE = re.compile(r"(?:address|पता)\s*[:\-]?\s*(.+)", re.IGNORECASE)


def extract_text(file_path: str, mime_type: str) -> str:
    """
    Runs OCR on an image file. For PDFs, the caller is expected to have
    already rasterized pages to images via pdf2image before calling this
    (see documents router) — kept separate so this function stays a pure
    "image -> text" operation and is easy to unit test.
    """
    image = Image.open(file_path)
    return pytesseract.image_to_string(image)


def extract_text_from_pdf(file_path: str) -> str:
    from pdf2image import convert_from_path

    pages = convert_from_path(file_path, dpi=300)
    texts = [pytesseract.image_to_string(page) for page in pages]
    return "\n".join(texts)


def mask_aadhaar(aadhaar: str) -> str:
    digits = re.sub(r"\s", "", aadhaar)
    if len(digits) == 12:
        return f"XXXX XXXX {digits[-4:]}"
    return "XXXX XXXX XXXX"


def extract_fields(raw_text: str) -> dict:
    """Best-effort structured field extraction from OCR text. Always review-
    before-submit on the frontend — this is a starting point, not ground truth."""
    fields: dict[str, str | None] = {
        "name": None,
        "date_of_birth": None,
        "aadhaar_number": None,
        "address": None,
        "document_number": None,
    }

    aadhaar_match = _AADHAAR_RE.search(raw_text)
    if aadhaar_match:
        fields["aadhaar_number"] = mask_aadhaar(aadhaar_match.group())

    dob_match = _DOB_RE.search(raw_text)
    if dob_match:
        fields["date_of_birth"] = dob_match.group(1)

    name_match = _NAME_LINE_RE.search(raw_text)
    if name_match:
        fields["name"] = name_match.group(1).strip()[:255]

    address_match = _ADDRESS_LINE_RE.search(raw_text)
    if address_match:
        fields["address"] = address_match.group(1).strip()[:500]

    # Document number: only look outside the Aadhaar match to avoid re-capturing it
    doc_match = _DOC_NUMBER_RE.search(raw_text)
    if doc_match:
        fields["document_number"] = doc_match.group()

    return fields


def run_ocr_pipeline(file_path: str, mime_type: str) -> tuple[str, dict]:
    """Returns (raw_text, extracted_fields) for a stored file."""
    if mime_type == "application/pdf":
        raw_text = extract_text_from_pdf(file_path)
    else:
        raw_text = extract_text(file_path, mime_type)
    fields = extract_fields(raw_text)
    return raw_text, fields
