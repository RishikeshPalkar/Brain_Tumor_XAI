import requests
import json

BASE_URL = "http://127.0.0.1:8081/api"

# 1. Health Check
print("=== 1. GET /api/health ===")
resp = requests.get(f"{BASE_URL}/health")
assert resp.status_code == 200
health = resp.json()
print("Health:", json.dumps(health, indent=2))
assert health["status"] == "UP"
assert health["database"]["status"] == "UP"
assert health["aiService"]["status"] == "UP"

# 2. Test All 4 Classes on Real MRI Images
samples = [
    ("sample_mri_images/glioma_Te-gl_0010.jpg", "glioma"),
    ("sample_mri_images/meningioma_Te-me_0010.jpg", "meningioma"),
    ("sample_mri_images/notumor_Te-no_0147.jpg", "notumor"),
    ("sample_mri_images/pituitary_Te-pi_0010.jpg", "pituitary"),
]

created_ids = []

print("\n=== 2. Testing Predictions Across All 4 Real MRI Categories ===")
for path, expected_cls in samples:
    with open(path, "rb") as f:
        files = {"file": (path.split("/")[-1], f, "image/jpeg")}
        data = {"generate_gradcam": "true", "alpha": "0.45"}
        resp = requests.post(f"{BASE_URL}/mri/analyze", files=files, data=data)

    assert resp.status_code == 200, resp.text
    res = resp.json()
    created_ids.append(res["id"])
    print(f"Sample: {path:45} -> Pred: {res['predictedClass']:12} ({res['confidence']*100:.2f}%) | Grad-CAM: {res['gradcamAvailable']} | Overlay size: {len(res['gradcamOverlayBase64'])} bytes")
    assert res["predictedClass"] == expected_cls
    assert res["gradcamAvailable"] is True
    assert res["gradcamOverlayBase64"].startswith("data:image/png;base64,")

# 3. Test GET /api/analyses (History)
print("\n=== 3. GET /api/analyses ===")
resp = requests.get(f"{BASE_URL}/analyses")
assert resp.status_code == 200
history = resp.json()
print(f"Total historical records in MySQL: {len(history)}")
for item in history[:4]:
    print(f" - ID: {item['id'][:8]}... | Class: {item['predictedClass']:12} | Conf: {item['confidence']*100:.1f}% | Date: {item['createdAt']}")

# 4. Test Single Detail Retrieval
test_id = created_ids[0]
print(f"\n=== 4. GET /api/analyses/{test_id} ===")
resp = requests.get(f"{BASE_URL}/analyses/{test_id}")
assert resp.status_code == 200
detail = resp.json()
assert detail["id"] == test_id
print(f"Retrieved: ID={detail['id']}, Class={detail['predictedClass']}, Conf={detail['confidence']}")

# 5. Test Record Deletion
print(f"\n=== 5. DELETE /api/analyses/{test_id} ===")
resp = requests.delete(f"{BASE_URL}/analyses/{test_id}")
assert resp.status_code == 200
print("Delete status:", resp.json())

# Verify it was removed
resp = requests.get(f"{BASE_URL}/analyses/{test_id}")
assert resp.status_code == 404
print("Verified 404 Not Found after deletion.")

# 6. Test Input Validation Rejections
print("\n=== 6. Security & Input Validation Rejections ===")
# 6a. Empty file
resp = requests.post(f"{BASE_URL}/mri/analyze", files={"file": ("empty.jpg", b"", "image/jpeg")})
assert resp.status_code == 400
print("Empty file rejected with HTTP 400:", resp.json()["message"])

# 6b. Text file disguised as image
resp = requests.post(f"{BASE_URL}/mri/analyze", files={"file": ("malicious.txt", b"plain text payload", "text/plain")})
assert resp.status_code == 400
print("Invalid MIME rejected with HTTP 400:", resp.json()["message"])

print("\n========================================================")
print(">>> ALL 6 END-TO-END VERIFICATION PHASES PASSED 100%! <<<")
print("========================================================")
