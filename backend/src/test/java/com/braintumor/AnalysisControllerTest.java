package com.braintumor;

import com.braintumor.dto.AiPredictionResponse;
import com.braintumor.entity.AnalysisHistory;
import com.braintumor.repository.AnalysisHistoryRepository;
import com.braintumor.service.AiClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiClientService aiClientService;

    @Autowired
    private AnalysisHistoryRepository repository;

    @BeforeEach
    void setup() {
        repository.deleteAll();
    }

    @Test
    void testHealthEndpoint() throws Exception {
        Mockito.when(aiClientService.checkHealth()).thenReturn(Map.of("status", "UP"));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database.status").value("UP"))
                .andExpect(jsonPath("$.aiService.status").value("UP"));
    }

    @Test
    void testAnalyzeValidMriImage() throws Exception {
        AiPredictionResponse fakeAiResponse = new AiPredictionResponse(
                "test-uuid-1234",
                "glioma",
                0.995,
                Map.of("glioma", 0.995, "meningioma", 0.003, "notumor", 0.001, "pituitary", 0.001),
                "efficientnetb4-v1",
                List.of(224, 224),
                true,
                "data:image/png;base64,iVBORw0KGgo...",
                120.5,
                List.of()
        );

        Mockito.when(aiClientService.predict(any(), anyBoolean(), anyDouble()))
                .thenReturn(fakeAiResponse);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "brain_scan.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "fake-mri-image-bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/mri/analyze")
                        .file(file)
                        .param("generate_gradcam", "true")
                        .param("alpha", "0.45"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("test-uuid-1234"))
                .andExpect(jsonPath("$.predictedClass").value("glioma"))
                .andExpect(jsonPath("$.confidence").value(0.995))
                .andExpect(jsonPath("$.classScores.glioma").value(0.995))
                .andExpect(jsonPath("$.gradcamAvailable").value(true))
                .andExpect(jsonPath("$.gradcamOverlayBase64").value("data:image/png;base64,iVBORw0KGgo..."))
                .andExpect(jsonPath("$.disclaimer").isNotEmpty());

        // Verify entity persisted in DB
        assert repository.findById("test-uuid-1234").isPresent();
    }

    @Test
    void testAnalyzeEmptyFileRejected() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[0]
        );

        mockMvc.perform(multipart("/api/mri/analyze").file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("cannot be empty")));
    }

    @Test
    void testAnalyzeInvalidFileTypeRejected() throws Exception {
        MockMultipartFile textFile = new MockMultipartFile(
                "file", "notes.txt", MediaType.TEXT_PLAIN_VALUE, "not an image".getBytes()
        );

        mockMvc.perform(multipart("/api/mri/analyze").file(textFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Invalid file format")));
    }

    @Test
    void testGetHistoryAndDetailAndDelete() throws Exception {
        AnalysisHistory history = new AnalysisHistory(
                "hist-1", "pituitary", 0.98,
                0.01, 0.01, 0.0, 0.98,
                "efficientnetb4-v1", 512, 512,
                true, 150.0, "127.0.0.1", Instant.now()
        );
        repository.save(history);

        // List
        mockMvc.perform(get("/api/analyses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("hist-1"))
                .andExpect(jsonPath("$[0].predictedClass").value("pituitary"));

        // Detail
        mockMvc.perform(get("/api/analyses/hist-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("hist-1"))
                .andExpect(jsonPath("$.predictedClass").value("pituitary"));

        // Delete
        mockMvc.perform(delete("/api/analyses/hist-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("successfully deleted")));

        // Verify deleted
        assert repository.findById("hist-1").isEmpty();
    }
}
