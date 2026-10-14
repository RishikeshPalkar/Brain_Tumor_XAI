import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.model import model_instance


@pytest.fixture(scope="session", autouse=True)
def load_test_model():
    # Ensure model is loaded for tests
    if not model_instance.loaded:
        model_instance.load()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "brain-tumor-xai-service"


def test_readiness_endpoint(client):
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "READY"
    assert "classes" in data
    assert data["classes"] == ["glioma", "meningioma", "notumor", "pituitary"]


def test_predict_empty_file(client):
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/predict", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["message"].lower()


def test_predict_corrupt_file(client):
    files = {"file": ("corrupt.jpg", b"NOT_AN_IMAGE_CONTENT", "image/jpeg")}
    response = client.post("/predict", files=files)
    assert response.status_code == 400
    assert "valid" in response.json()["message"].lower() or "corrupt" in response.json()["message"].lower()


def test_predict_unsupported_content_type(client):
    files = {"file": ("document.pdf", b"%PDF-1.4...", "application/pdf")}
    response = client.post("/predict", files=files)
    assert response.status_code == 400
    assert "unsupported" in response.json()["message"].lower()


def test_predict_valid_synthetic_image(client):
    # Create valid synthetic RGB image
    img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("synthetic.jpg", buf.getvalue(), "image/jpeg")}
    response = client.post("/predict", files=files, data={"generate_gradcam": "true", "alpha": "0.4"})
    assert response.status_code == 200
    data = response.json()

    assert "predicted_class" in data
    assert data["predicted_class"] in ["glioma", "meningioma", "notumor", "pituitary"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert len(data["class_scores"]) == 4
    assert data["gradcam_available"] is True
    assert data["gradcam_overlay_base64"].startswith("data:image/png;base64,")
    assert data["processing_time_ms"] > 0


def test_predict_real_mri_sample(client):
    import os
    sample_file = "sample_mri_images/glioma_Te-gl_0010.jpg"
    if os.path.exists(sample_file):
        with open(sample_file, "rb") as f:
            files = {"file": ("glioma_Te-gl_0010.jpg", f.read(), "image/jpeg")}
        response = client.post("/predict", files=files, data={"generate_gradcam": "true"})
        assert response.status_code == 200
        data = response.json()
        assert data["predicted_class"] == "glioma"
        assert data["confidence"] > 0.9
        assert data["gradcam_available"] is True
