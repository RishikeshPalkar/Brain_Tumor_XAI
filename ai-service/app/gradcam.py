import io
import base64
import logging
import numpy as np
import tensorflow as tf
import matplotlib as mpl
from PIL import Image
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class GradCAMExplainer:
    def __init__(self, model: tf.keras.Model):
        """
        Initializes the Grad-CAM explainer for the EfficientNetB4 Sequential model.
        Model structure:
          sequential
            └── efficientnetb4 (Functional)
                 ├── ...
                 ├── top_conv (Conv2D) -> (None, 7, 7, 1792)
                 ├── top_bn (BatchNormalization)
                 ├── top_activation (Activation)
                 └── max_pool (GlobalMaxPooling2D)
            └── dense (Dense 256, ReLU)
            └── dropout (Dropout 0.45)
            └── dense_1 (Dense 4, Softmax)
        """
        self.model = model
        try:
            self.eff_model = model.get_layer("efficientnetb4")
            self.top_conv = self.eff_model.get_layer("top_conv")
            self.top_bn = self.eff_model.get_layer("top_bn")
            self.top_activation = self.eff_model.get_layer("top_activation")
            self.max_pool = self.eff_model.get_layer("max_pool")
            self.dense = model.get_layer("dense")
            self.dense_1 = model.get_layer("dense_1")

            # Intermediate model from input to conv layer output
            self.conv_model = tf.keras.Model(
                inputs=self.eff_model.input,
                outputs=self.top_conv.output
            )
            self.ready = True
            logger.info("GradCAMExplainer initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize GradCAMExplainer: {e}", exc_info=True)
            self.ready = False

    def generate_heatmap(self, input_tensor: tf.Tensor, class_idx: int) -> Optional[np.ndarray]:
        """
        Generates a 2D normalized Grad-CAM heatmap for the given class index.
        """
        if not self.ready:
            return None

        try:
            with tf.GradientTape() as tape:
                conv_outputs = self.conv_model(input_tensor, training=False)
                tape.watch(conv_outputs)

                # Feed forward through remaining layers to final output
                x = self.top_bn(conv_outputs, training=False)
                x = self.top_activation(x)
                x = self.max_pool(x)
                x = self.dense(x)
                predictions = self.dense_1(x)

                loss = predictions[:, class_idx]

            grads = tape.gradient(loss, conv_outputs)
            if grads is None:
                logger.warning("Grad-CAM: Gradients evaluated to None.")
                return None

            # Global average pooling of gradients
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

            # Weight the feature maps by the pooled gradients
            conv_outputs_val = conv_outputs[0]
            heatmap = conv_outputs_val @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)

            # ReLU on the weighted maps
            heatmap = tf.maximum(heatmap, 0.0)

            max_val = tf.math.reduce_max(heatmap)
            if max_val == 0.0 or tf.math.is_nan(max_val):
                logger.warning("Grad-CAM: Heatmap max value is 0 or NaN.")
                return np.zeros((7, 7), dtype=np.float32)

            heatmap = heatmap / (max_val + 1e-10)
            return heatmap.numpy()

        except Exception as e:
            logger.error(f"Error computing Grad-CAM heatmap: {e}", exc_info=True)
            return None

    def create_overlay(
        self,
        heatmap: np.ndarray,
        orig_image: Image.Image,
        alpha: float = 0.4
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Overlays the Grad-CAM heatmap on the original image and returns
        both the overlay as a base64 PNG data URL and the raw colored heatmap.
        """
        try:
            orig_w, orig_h = orig_image.size

            # Resize 7x7 heatmap to original image dimensions using bicubic interpolation
            heatmap_uint8 = np.uint8(255 * np.clip(heatmap, 0.0, 1.0))
            heatmap_pil = Image.fromarray(heatmap_uint8)
            heatmap_resized = heatmap_pil.resize((orig_w, orig_h), Image.Resampling.BICUBIC)
            heatmap_norm = np.array(heatmap_resized, dtype=np.float32) / 255.0

            # Apply JET colormap
            cmap = mpl.colormaps["jet"]
            colored_heatmap = cmap(heatmap_norm)[:, :, :3]  # RGB, range [0, 1]
            colored_heatmap_uint8 = np.uint8(255 * colored_heatmap)

            # Blend with original RGB image
            orig_rgb = np.array(orig_image.convert("RGB"), dtype=np.float32)
            alpha_clamped = max(0.1, min(0.9, alpha))
            blended = np.uint8(orig_rgb * (1.0 - alpha_clamped) + colored_heatmap_uint8 * alpha_clamped)

            blended_img = Image.fromarray(blended)
            buffered = io.BytesIO()
            blended_img.save(buffered, format="PNG", optimize=True)
            overlay_base64 = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

            return overlay_base64, None

        except Exception as e:
            logger.error(f"Error generating Grad-CAM overlay image: {e}", exc_info=True)
            return None, str(e)
