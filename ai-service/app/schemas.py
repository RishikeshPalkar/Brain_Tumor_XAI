from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "UP"})
    service: str = Field(..., json_schema_extra={"example": "brain-tumor-xai-service"})


class ReadinessResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "READY"})
    model_version: str = Field(..., json_schema_extra={"example": "efficientnetb4-v1"})
    classes: List[str] = Field(..., json_schema_extra={"example": ["glioma", "meningioma", "notumor", "pituitary"]})
    input_shape: List[int] = Field(..., json_schema_extra={"example": [224, 224, 3]})


class PredictionResponse(BaseModel):
    request_id: str
    predicted_class: str
    confidence: float
    class_scores: Dict[str, float]
    model_version: str
    original_image_dimensions: List[int]
    gradcam_available: bool
    gradcam_overlay_base64: Optional[str] = None
    processing_time_ms: float
    warnings: List[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: Optional[str] = None
