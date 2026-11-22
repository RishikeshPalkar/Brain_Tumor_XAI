package com.braintumor.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "analysis_history")
public class AnalysisHistory {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "predicted_class", length = 50, nullable = false)
    private String predictedClass;

    @Column(name = "confidence", nullable = false)
    private Double confidence;

    @Column(name = "score_glioma", nullable = false)
    private Double scoreGlioma;

    @Column(name = "score_meningioma", nullable = false)
    private Double scoreMeningioma;

    @Column(name = "score_notumor", nullable = false)
    private Double scoreNotumor;

    @Column(name = "score_pituitary", nullable = false)
    private Double scorePituitary;

    @Column(name = "model_version", length = 50, nullable = false)
    private String modelVersion;

    @Column(name = "image_width")
    private Integer imageWidth;

    @Column(name = "image_height")
    private Integer imageHeight;

    @Column(name = "gradcam_available", nullable = false)
    private Boolean gradcamAvailable;

    @Column(name = "processing_time_ms")
    private Double processingTimeMs;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AnalysisHistory() {
    }

    public AnalysisHistory(String id, String predictedClass, Double confidence,
                           Double scoreGlioma, Double scoreMeningioma, Double scoreNotumor, Double scorePituitary,
                           String modelVersion, Integer imageWidth, Integer imageHeight,
                           Boolean gradcamAvailable, Double processingTimeMs, String clientIp, Instant createdAt) {
        this.id = id;
        this.predictedClass = predictedClass;
        this.confidence = confidence;
        this.scoreGlioma = scoreGlioma;
        this.scoreMeningioma = scoreMeningioma;
        this.scoreNotumor = scoreNotumor;
        this.scorePituitary = scorePituitary;
        this.modelVersion = modelVersion;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.gradcamAvailable = gradcamAvailable;
        this.processingTimeMs = processingTimeMs;
        this.clientIp = clientIp;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPredictedClass() { return predictedClass; }
    public void setPredictedClass(String predictedClass) { this.predictedClass = predictedClass; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public Double getScoreGlioma() { return scoreGlioma; }
    public void setScoreGlioma(Double scoreGlioma) { this.scoreGlioma = scoreGlioma; }

    public Double getScoreMeningioma() { return scoreMeningioma; }
    public void setScoreMeningioma(Double scoreMeningioma) { this.scoreMeningioma = scoreMeningioma; }

    public Double getScoreNotumor() { return scoreNotumor; }
    public void setScoreNotumor(Double scoreNotumor) { this.scoreNotumor = scoreNotumor; }

    public Double getScorePituitary() { return scorePituitary; }
    public void setScorePituitary(Double scorePituitary) { this.scorePituitary = scorePituitary; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public Integer getImageWidth() { return imageWidth; }
    public void setImageWidth(Integer imageWidth) { this.imageWidth = imageWidth; }

    public Integer getImageHeight() { return imageHeight; }
    public void setImageHeight(Integer imageHeight) { this.imageHeight = imageHeight; }

    public Boolean getGradcamAvailable() { return gradcamAvailable; }
    public void setGradcamAvailable(Boolean gradcamAvailable) { this.gradcamAvailable = gradcamAvailable; }

    public Double getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(Double processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
