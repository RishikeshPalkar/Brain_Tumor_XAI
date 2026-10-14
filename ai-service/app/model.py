import os
import time
import uuid
import logging
import numpy as np
import tensorflow as tf
from PIL import Image
from typing import Tuple, Dict, Any, Optional

from app.config import settings
from app.gradcam import GradCAMExplainer
from app.schemas import PredictionResponse

logger = logging.getLogger(__name__)


class BrainTumorModel:
    def __init__(self):
        self.model: Optional[tf.keras.Model] = None
        self.explainer: Optional[GradCAMExplainer] = None
        self.loaded: bool = False

    def load(self, model_path: Optional[str] = None):
        path = model_path or settings.MODEL_PATH
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model artifact not found at: {path}")

        logger.info(f"Loading Keras model from {path}...")
        start_time = time.time()
        # tf.keras / keras.saving.load_model
        import keras
        self.model = keras.saving.load_model(path, compile=False)
        self.explainer = GradCAMExplainer(self.model)
        self.loaded = True
        logger.info(f"Model loaded successfully in {time.time() - start_time:.2f}s")

    def preprocess_image(self, pil_image: Image.Image) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Takes a PIL image, converts to RGB, resizes to (224, 224),
        and returns as float32 array in [0, 255] along with original dimensions.
        """
        orig_dims = pil_image.size  # (width, height)
        rgb_image = pil_image.convert("RGB")
        resized_image = rgb_image.resize(settings.INPUT_SIZE, Image.Resampling.BILINEAR)
        img_array = np.array(resized_image, dtype=np.float32)
        batch_array = np.expand_dims(img_array, axis=0)  # shape (1, 224, 224, 3)
        return batch_array, orig_dims

    def predict(
        self,
        pil_image: Image.Image,
        generate_gradcam: bool = True,
        alpha: float = 0.4
    ) -> PredictionResponse:
        if not self.loaded or self.model is None:
            raise RuntimeError("Model is not loaded.")

        start_time = time.perf_counter()
        req_id = str(uuid.uuid4())
        warnings: list[str] = []

        batch_array, orig_dims = self.preprocess_image(pil_image)
        input_tensor = tf.constant(batch_array)

        # Run inference
        raw_preds = self.model(input_tensor, training=False).numpy()[0]

        # Check for invalid outputs
        if np.isnan(raw_preds).any() or np.isinf(raw_preds).any():
            raise ValueError("Model inference produced non-finite values (NaN/Inf).")

        # Class scores
        class_scores: Dict[str, float] = {
            cls_name: float(round(float(raw_preds[i]), 5))
            for i, cls_name in enumerate(settings.CLASSES)
        }

        pred_idx = int(np.argmax(raw_preds))
        predicted_class = settings.CLASSES[pred_idx]
        confidence = float(round(float(raw_preds[pred_idx]), 5))

        overlay_b64: Optional[str] = None
        gradcam_available: bool = False

        if generate_gradcam and self.explainer and self.explainer.ready:
            try:
                heatmap = self.explainer.generate_heatmap(input_tensor, pred_idx)
                if heatmap is not None:
                    overlay_b64, err = self.explainer.create_overlay(heatmap, pil_image, alpha=alpha)
                    if overlay_b64:
                        gradcam_available = True
                    else:
                        warnings.append(f"Grad-CAM overlay generation failed: {err}")
                else:
                    warnings.append("Grad-CAM heatmap could not be computed for this input.")
            except Exception as e:
                logger.error(f"Failed to generate Grad-CAM: {e}", exc_info=True)
                warnings.append(f"Grad-CAM error: {str(e)}")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return PredictionResponse(
            request_id=req_id,
            predicted_class=predicted_class,
            confidence=confidence,
            class_scores=class_scores,
            model_version=settings.MODEL_VERSION,
            original_image_dimensions=[orig_dims[0], orig_dims[1]],
            gradcam_available=gradcam_available,
            gradcam_overlay_base64=overlay_b64,
            processing_time_ms=elapsed_ms,
            warnings=warnings
        )


model_instance = BrainTumorModel()
