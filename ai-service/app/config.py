import os
from typing import List, Set, Tuple


class Settings:
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "brain_tumor_model.keras"))
    )
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "efficientnetb4-v1")
    CLASSES: List[str] = ["glioma", "meningioma", "notumor", "pituitary"]
    INPUT_SIZE: Tuple[int, int] = (224, 224)
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: Set[str] = {"image/jpeg", "image/png", "image/webp"}
    MAX_IMAGE_DIMENSION: int = 4096
    MIN_IMAGE_DIMENSION: int = 32
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")


settings = Settings()
