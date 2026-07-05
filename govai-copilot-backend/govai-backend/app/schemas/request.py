from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import RequestStatus


class RequestCreate(BaseModel):
    service_type: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=5000)
    ai_prompt: str | None = Field(default=None, max_length=5000, description="Citizen's original chat message to the AI")
    ai_response_text: str | None = Field(default=None, max_length=8000, description="AI response citizen is submitting alongside")


class RequestStatusUpdate(BaseModel):
    status: RequestStatus
    remarks: str | None = Field(default=None, max_length=3000)


class RequestOut(BaseModel):
    id: str
    request_number: str
    service_type: str
    description: str | None
    status: RequestStatus
    officer_remarks: str | None
    assigned_officer_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RequestDetailOut(RequestOut):
    citizen_name: str
    citizen_id: str
