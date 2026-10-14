package com.braintumor.service;

import com.braintumor.dto.AiPredictionResponse;
import com.braintumor.exception.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.Map;

@Service
public class AiClientService {

    private static final Logger logger = LoggerFactory.getLogger(AiClientService.class);
    private final WebClient aiServiceWebClient;

    public AiClientService(WebClient aiServiceWebClient) {
        this.aiServiceWebClient = aiServiceWebClient;
    }

    public AiPredictionResponse predict(MultipartFile file, boolean generateGradcam, double alpha) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Unable to read image file data.", e);
        }

        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg";
            }
        };

        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", resource, MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : MediaType.IMAGE_JPEG_VALUE
        ));
        bodyBuilder.part("generate_gradcam", String.valueOf(generateGradcam));
        bodyBuilder.part("alpha", String.valueOf(alpha));

        try {
            return aiServiceWebClient.post()
                    .uri("/predict")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                                    .<Throwable>flatMap(body -> {
                                        String msg = (body != null && body.containsKey("message"))
                                                ? String.valueOf(body.get("message"))
                                                : "AI inference error";
                                        return Mono.error(new AiServiceException(msg, clientResponse.statusCode().value()));
                                    })
                                    .switchIfEmpty(Mono.error(new AiServiceException("AI inference service error", clientResponse.statusCode().value())))
                    )
                    .bodyToMono(AiPredictionResponse.class)
                    .block();
        } catch (WebClientRequestException e) {
            logger.error("Failed to connect to AI inference service: {}", e.getMessage());
            throw new AiServiceException("The AI inference service is temporarily unreachable.", 503);
        } catch (WebClientResponseException e) {
            logger.error("AI service error response: {}", e.getResponseBodyAsString());
            throw new AiServiceException("AI Service error: " + e.getStatusText(), e.getStatusCode().value());
        }
    }

    public Map<String, Object> checkHealth() {
        try {
            return aiServiceWebClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (Exception e) {
            logger.warn("AI service health check failed: {}", e.getMessage());
            return Map.of("status", "DOWN", "error", e.getMessage() != null ? e.getMessage() : "Unknown");
        }
    }

    public Map<String, Object> checkReadiness() {
        try {
            return aiServiceWebClient.get()
                    .uri("/ready")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (Exception e) {
            logger.warn("AI service readiness check failed: {}", e.getMessage());
            return Map.of("status", "NOT_READY", "error", e.getMessage() != null ? e.getMessage() : "Unknown");
        }
    }
}
