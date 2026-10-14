package com.braintumor.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AnalysisResponseDto(
    String id,
    String predictedClass,
    Double confidence,
    Map<String, Double> classScores,
    String modelVersion,
    List<Integer> imageDimensions,
    Boolean gradcamAvailable,
    String gradcamOverlayBase64,
    Double processingTimeMs,
    Instant timestamp,
    List<String> warnings,
    String disclaimer
) {
    public static final String MEDICAL_DISCLAIMER =
        "This tool is for educational and research purposes only and is NOT a certified medical diagnostic device. " +
        "Confidence scores reflect model output distributions, not clinical probabilities. " +
        "Grad-CAM visualizes regions influencing the neural network and does not denote verified tumor margins or clinical pathology.";
}
