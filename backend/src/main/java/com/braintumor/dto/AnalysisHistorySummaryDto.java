package com.braintumor.dto;

import java.time.Instant;
import java.util.Map;

public record AnalysisHistorySummaryDto(
    String id,
    String predictedClass,
    Double confidence,
    Map<String, Double> classScores,
    String modelVersion,
    Boolean gradcamAvailable,
    Double processingTimeMs,
    Instant createdAt
) {}
