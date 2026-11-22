package com.braintumor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public record AiPredictionResponse(
    @JsonProperty("request_id") String requestId,
    @JsonProperty("predicted_class") String predictedClass,
    @JsonProperty("confidence") Double confidence,
    @JsonProperty("class_scores") Map<String, Double> classScores,
    @JsonProperty("model_version") String modelVersion,
    @JsonProperty("original_image_dimensions") List<Integer> originalImageDimensions,
    @JsonProperty("gradcam_available") Boolean gradcamAvailable,
    @JsonProperty("gradcam_overlay_base64") String gradcamOverlayBase64,
    @JsonProperty("processing_time_ms") Double processingTimeMs,
    @JsonProperty("warnings") List<String> warnings
) {}
