package com.braintumor.controller;

import com.braintumor.dto.AnalysisHistorySummaryDto;
import com.braintumor.dto.AnalysisResponseDto;
import com.braintumor.service.AnalysisService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping(value = "/mri/analyze", consumes = "multipart/form-data")
    public ResponseEntity<AnalysisResponseDto> analyzeMri(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "generate_gradcam", defaultValue = "true") boolean generateGradcam,
            @RequestParam(value = "alpha", defaultValue = "0.45") double alpha,
            HttpServletRequest request
    ) {
        String clientIp = extractClientIp(request);
        AnalysisResponseDto response = analysisService.analyzeImage(file, generateGradcam, alpha, clientIp);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analyses")
    public ResponseEntity<List<AnalysisHistorySummaryDto>> getAnalyses() {
        return ResponseEntity.ok(analysisService.getHistory());
    }

    @GetMapping("/analyses/{id}")
    public ResponseEntity<AnalysisHistorySummaryDto> getAnalysisById(@PathVariable String id) {
        return ResponseEntity.ok(analysisService.getAnalysisById(id));
    }

    @DeleteMapping("/analyses/{id}")
    public ResponseEntity<Map<String, String>> deleteAnalysis(@PathVariable String id) {
        analysisService.deleteAnalysis(id);
        return ResponseEntity.ok(Map.of("message", "Analysis record successfully deleted", "id", id));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
