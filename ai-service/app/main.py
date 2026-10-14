import io
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from app.config import settings
from app.model import model_instance
from app.schemas import HealthResponse, ReadinessResponse, PredictionResponse, ErrorResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("brain-tumor-ai-service")

# Prevent decompression bombs
Image.MAX_IMAGE_PIXELS = 10_000_000


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model once
    logger.info("Initializing Brain Tumor AI Service...")
    try:
        model_instance.load()
        logger.info("Brain Tumor Model ready for inference.")
    except Exception as e:
        logger.error(f"Critical error loading model: {e}", exc_info=True)
    yield
    # Shutdown
    logger.info("Shutting down Brain Tumor AI Service.")


app = FastAPI(
    title="Brain Tumor Detection AI Service",
    description="Inference and Explainable AI (Grad-CAM) service for Brain MRI classification.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Internal service, protected by Spring Boot proxy
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="UP", service="brain-tumor-xai-service")


@app.get("/ready", response_model=ReadinessResponse)
def readiness():
    if not model_instance.loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not ready or failed to load."
        )
    return ReadinessResponse(
        status="READY",
        model_version=settings.MODEL_VERSION,
        classes=settings.CLASSES,
        input_shape=[settings.INPUT_SIZE[0], settings.INPUT_SIZE[1], 3]
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(..., description="Brain MRI scan (JPEG, PNG, or WebP)"),
    generate_gradcam: bool = Form(default=True),
    alpha: float = Form(default=0.45)
):
    if not model_instance.loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not ready. Please try again shortly."
        )

    # 1. Validate content type if supplied
    if file.content_type and file.content_type not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Allowed types: {list(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Read bytes and check size
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # 3. Securely validate and load image using PIL
    try:
        buffer = io.BytesIO(contents)
        # First verify image header integrity
        test_img = Image.open(buffer)
        test_img.verify()

        # Re-open after verify()
        buffer.seek(0)
        img = Image.open(buffer)

        # Check format
        if img.format not in ["JPEG", "PNG", "WEBP"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image format '{img.format}'. Only JPEG, PNG, and WebP are supported."
            )

        # Check dimensions
        width, height = img.size
        if width < settings.MIN_IMAGE_DIMENSION or height < settings.MIN_IMAGE_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image dimensions ({width}x{height}) are too small. Minimum required: {settings.MIN_IMAGE_DIMENSION}x{settings.MIN_IMAGE_DIMENSION}."
            )
        if width > settings.MAX_IMAGE_DIMENSION or height > settings.MAX_IMAGE_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image dimensions ({width}x{height}) exceed maximum allowed {settings.MAX_IMAGE_DIMENSION}x{settings.MAX_IMAGE_DIMENSION}."
            )

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid or recognizable image."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Image validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or malformed image data."
        )

    # 4. Perform model prediction and Grad-CAM generation
    try:
        response = model_instance.predict(
            pil_image=img,
            generate_gradcam=generate_gradcam,
            alpha=alpha
        )
        return response
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during image inference."
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "ClientError", "message": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "InternalServerError", "message": "An unexpected error occurred."}
    )
