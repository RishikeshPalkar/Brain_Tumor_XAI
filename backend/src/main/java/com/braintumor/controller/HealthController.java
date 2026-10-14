package com.braintumor.controller;

import com.braintumor.service.AiClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final AiClientService aiClientService;
    private final JdbcTemplate jdbcTemplate;

    public HealthController(AiClientService aiClientService, JdbcTemplate jdbcTemplate) {
        this.aiClientService = aiClientService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "brain-tumor-backend");
        response.put("status", "UP");
        response.put("timestamp", Instant.now().toString());

        // Check DB connectivity
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("database", Map.of("status", "UP"));
        } catch (Exception e) {
            response.put("database", Map.of("status", "DOWN", "error", e.getMessage()));
        }

        // Check AI service status
        Map<String, Object> aiHealth = aiClientService.checkHealth();
        response.put("aiService", aiHealth);

        return ResponseEntity.ok(response);
    }
}
