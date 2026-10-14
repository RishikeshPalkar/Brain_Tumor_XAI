CREATE TABLE IF NOT EXISTS analysis_history (
    id VARCHAR(36) NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence DOUBLE NOT NULL,
    score_glioma DOUBLE NOT NULL,
    score_meningioma DOUBLE NOT NULL,
    score_notumor DOUBLE NOT NULL,
    score_pituitary DOUBLE NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    image_width INT,
    image_height INT,
    gradcam_available BOOLEAN NOT NULL,
    processing_time_ms DOUBLE,
    client_ip VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_analysis_history PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_analysis_created_at ON analysis_history (created_at DESC);
CREATE INDEX idx_analysis_predicted_class ON analysis_history (predicted_class);
