package com.braintumor.service;

import com.braintumor.dto.AiPredictionResponse;
import com.braintumor.dto.AnalysisHistorySummaryDto;
import com.braintumor.dto.AnalysisResponseDto;
import com.braintumor.entity.AnalysisHistory;
import com.braintumor.exception.InvalidImageException;
import com.braintumor.exception.ResourceNotFoundException;
import com.braintumor.repository.AnalysisHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AnalysisService.class);
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final AiClientService aiClientService;
    private final AnalysisHistoryRepository repository;

    public AnalysisService(AiClientService aiClientService, AnalysisHistoryRepository repository) {
        this.aiClientService = aiClientService;
        this.repository = repository;
    }

    @Transactional
    public AnalysisResponseDto analyzeImage(MultipartFile file, boolean generateGradcam, double alpha, String clientIp) {
        // 1. Validation
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Uploaded file cannot be empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidImageException("File size exceeds 10 MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidImageException("Invalid file format. Only JPEG, PNG, and WebP images are permitted.");
        }

        // 2. Call AI Inference Service
        logger.info("Forwarding MRI scan to AI inference service. Size: {} bytes, ContentType: {}", file.getSize(), contentType);
        AiPredictionResponse aiResponse = aiClientService.predict(file, generateGradcam, alpha);

        if (aiResponse == null) {
            throw new IllegalStateException("Received empty response from AI inference service.");
        }

        String analysisId = aiResponse.requestId() != null ? aiResponse.requestId() : UUID.randomUUID().toString();
        Map<String, Double> scores = aiResponse.classScores() != null ? aiResponse.classScores() : Map.of();

        Double scoreGlioma = scores.getOrDefault("glioma", 0.0);
        Double scoreMeningioma = scores.getOrDefault("meningioma", 0.0);
        Double scoreNotumor = scores.getOrDefault("notumor", 0.0);
        Double scorePituitary = scores.getOrDefault("pituitary", 0.0);

        List<Integer> dims = aiResponse.originalImageDimensions();
        Integer width = (dims != null && dims.size() > 0) ? dims.get(0) : null;
        Integer height = (dims != null && dims.size() > 1) ? dims.get(1) : null;

        // 3. Persist metadata (WITHOUT images or base64)
        AnalysisHistory history = new AnalysisHistory(
                analysisId,
                aiResponse.predictedClass(),
                aiResponse.confidence(),
                scoreGlioma,
                scoreMeningioma,
                scoreNotumor,
                scorePituitary,
                aiResponse.modelVersion(),
                width,
                height,
                Boolean.TRUE.equals(aiResponse.gradcamAvailable()),
                aiResponse.processingTimeMs(),
                clientIp,
                Instant.now()
        );

        try {
            repository.save(history);
            logger.info("Successfully persisted analysis record: id={}, class={}", analysisId, aiResponse.predictedClass());
        } catch (Exception e) {
            logger.error("Failed to persist analysis history to database: {}", e.getMessage(), e);
            // Non-blocking for returning prediction if DB write encounters transient issue
        }

        // 4. Return complete response including ephemeral Grad-CAM overlay
        return new AnalysisResponseDto(
                analysisId,
                aiResponse.predictedClass(),
                aiResponse.confidence(),
                scores,
                aiResponse.modelVersion(),
                dims,
                Boolean.TRUE.equals(aiResponse.gradcamAvailable()),
                aiResponse.gradcamOverlayBase64(),
                aiResponse.processingTimeMs(),
                history.getCreatedAt(),
                aiResponse.warnings() != null ? aiResponse.warnings() : List.of(),
                AnalysisResponseDto.MEDICAL_DISCLAIMER
        );
    }

    @Transactional(readOnly = true)
    public List<AnalysisHistorySummaryDto> getHistory() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AnalysisHistorySummaryDto getAnalysisById(String id) {
        AnalysisHistory entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis record not found for id: " + id));
        return mapToSummaryDto(entity);
    }

    @Transactional
    public void deleteAnalysis(String id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Analysis record not found for id: " + id);
        }
        repository.deleteById(id);
        logger.info("Deleted analysis record: {}", id);
    }

    private AnalysisHistorySummaryDto mapToSummaryDto(AnalysisHistory entity) {
        Map<String, Double> scores = Map.of(
                "glioma", entity.getScoreGlioma(),
                "meningioma", entity.getScoreMeningioma(),
                "notumor", entity.getScoreNotumor(),
                "pituitary", entity.getScorePituitary()
        );

        return new AnalysisHistorySummaryDto(
                entity.getId(),
                entity.getPredictedClass(),
                entity.getConfidence(),
                scores,
                entity.getModelVersion(),
                entity.getGradcamAvailable(),
                entity.getProcessingTimeMs(),
                entity.getCreatedAt()
        );
    }
}
