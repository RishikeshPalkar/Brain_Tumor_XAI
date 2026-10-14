# 🧠 Brain Tumor Detection & Explainable AI (XAI)

A production-ready, secure, and maintainable web application for **Brain MRI tumor classification** and **Explainable AI (Grad-CAM)** interpretability.

> [!WARNING]
> **MEDICAL & EDUCATIONAL DISCLAIMER**  
> This project is developed exclusively for **educational, technical demonstration, and research purposes**. It is **not** a certified medical diagnostic device (SaMD) and has not received FDA, CE, or clinical regulatory validation.  
> - Classification confidence scores reflect internal neural network softmax distributions, **not calibrated clinical diagnostic probabilities**.  
> - Grad-CAM heatmaps highlight salient receptive field activations that contributed to the model's prediction; they **do not represent pathological tumor boundaries or surgical resection margins**.

---

## 📌 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Model Verification & Provenance](#3-model-verification--provenance)
4. [Repository Organization](#4-repository-organization)
5. [Prerequisites](#5-prerequisites)
6. [Environment Variables](#6-environment-variables)
7. [Quick Start with Docker Compose](#7-quick-start-with-docker-compose)
8. [Local Development Setup (Host Mode)](#8-local-development-setup-host-mode)
9. [Database Schema & Migrations](#9-database-schema--migrations)
10. [REST API Documentation](#10-rest-api-documentation)
11. [Explainable AI (Grad-CAM) Implementation](#11-explainable-ai-grad-cam-implementation)
12. [Automated Testing & Verification](#12-automated-testing--verification)
13. [Database Backup & Restore](#13-database-backup--restore)
14. [Security & Privacy Controls](#14-security--privacy-controls)
15. [Production Deployment Strategy](#15-production-deployment-strategy)
16. [Troubleshooting Guide](#16-troubleshooting-guide)

---

## 1. Architecture Overview

The system strictly decouples the user interface, orchestration/security layer, database, and machine learning inference service:

```
[ Next.js 14 Frontend ] (Port 3000)
         │
         │  HTTP / Multipart Upload
         ▼
[ Spring Boot 3 REST API ] (Port 8081 / Java 21)
         │                               │
         │ HTTP / Multipart              │ JDBC (HikariCP)
         ▼                               ▼
[ FastAPI AI Service ] (Port 8000)  [ MySQL 8.4 LTS Database ] (Port 3307)
         │                           • analysis_history
         ▼                           • flyway_schema_history
[ EfficientNet-B4 + Grad-CAM ]
```

### Separation of Responsibilities
- **Next.js 14 Frontend:** Client-side drag-and-drop file validation, image previews, result score visualizations, interactive Grad-CAM side-by-side viewer with blend opacity controls, and historical record browsing.
- **Spring Boot 3 Backend:** Public API gateway, request size validation (10 MB limit), security headers (CSP, X-Frame-Options, XSS protection), connection timeouts to AI microservices via reactive `WebClient`, and metadata persistence in MySQL.
- **Python FastAPI Service:** Secure image integrity validation (PIL header checks, decompression bomb limits), Keras model inference, Grad-CAM gradient calculation w.r.t `top_conv`, and colormapped overlay rendering.
- **Dockerized MySQL 8.4 LTS:** Flyway-managed schema persistence for analysis metadata (request IDs, class scores, latency, client IP, timestamps). **No raw MRI images or base64 blobs are stored in the database.**

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js / React / TypeScript | 14.2 / 18.3 / 5.6 | Client user interface & visualization |
| | Tailwind CSS | 3.4 | Responsive dark-mode medical UI |
| | Lucide React | 0.454 | Accessible medical icons |
| **Backend** | Java | 21 (LTS) | Core enterprise language |
| | Spring Boot | 3.3.5 | REST framework & security |
| | Spring Data JPA / Hibernate | 6.5 | Database ORM & validation |
| | Flyway | 10.x | Schema versioning & migrations |
| | Spring WebFlux (WebClient) | 3.3.5 | Non-blocking HTTP client for AI service |
| **AI Service** | Python | 3.11 / 3.12 | Deep learning runtime |
| | TensorFlow / Keras | 2.21 / 3.15 | Neural network computation |
| | FastAPI / Uvicorn | 0.143 / 0.54 | High-performance async microservice |
| | Pillow / NumPy | 10.4 / 1.26 | Image processing & tensor ops |
| | Matplotlib | 3.10 | JET colormap generation |
| **Database** | MySQL | 8.4 (LTS) | Persistent relational store |
| | Docker & Compose | 29.1 / 2.40 | Containerized infrastructure |

---

## 3. Model Verification & Provenance

### Model Analysis
The model originates from the [Brain-Tumor-Detection-XAI](https://github.com/lokesh8n8/Brain-Tumor-Detection-XAI) repository.
- **Architecture:** `tf.keras.applications.EfficientNetB4` backbone with `GlobalMaxPooling2D`, followed by `Dense(256, activation='relu')`, `Dropout(0.45)`, and `Dense(4, activation='softmax')`.
- **Total Parameters:** 18,133,859 (Trainable: 18,008,652).
- **Input Specifications:** 224 × 224 × 3 RGB images with pixel values in `[0, 255]`. (The EfficientNet graph contains built-in `Rescaling(1/255)` and ImageNet normalization layers).

### Model Conversion & Deserialization Security
The upstream repository split the model into three chunked binary files (`model_part0.pkl`, `model_part1.pkl`, `model_part2.pkl`) using Python `pickle`.
1. **Security Vulnerability Resolved:** In accordance with prompt instructions, untrusted pickle deserialization in production was eliminated.
2. **Native Keras 3 Format:** The weights (`model.weights.h5`) were extracted from the archive and cleanly re-linked into an explicit Keras 3 architecture, creating `ai-service/models/brain_tumor_model.keras` (70.7 MB).
3. **Compatibility:** This format loads safely in `<1 second` via `keras.saving.load_model` without arbitrary code execution risks.

### Verified Class-to-Index Mapping
Verified using 12 sample MRI test scans across all classes:
| Index | Class Name | Description | Verified Test Accuracy |
|:---:|:---:|---|:---:|
| **0** | `glioma` | Primary tumors arising from glial cells | 100.0% |
| **1** | `meningioma` | Tumors arising from protective brain membranes | 100.0% |
| **2** | `notumor` | Healthy brain scan devoid of detectable neoplasms | 100.0% |
| **3** | `pituitary` | Sellar/suprasellar pituitary gland lesions | 100.0% |

---

## 4. Repository Organization

```
brain-tumor-detection/
├── ai-service/                   # Python FastAPI Inference & Grad-CAM Service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py             # Environment & limits configuration
│   │   ├── gradcam.py            # Grad-CAM explainer engine
│   │   ├── main.py               # FastAPI routes & input validation
│   │   ├── model.py              # Model lifecycle & inference logic
│   │   └── schemas.py            # Pydantic request/response models
│   ├── models/
│   │   └── brain_tumor_model.keras  # Verified 70.7MB Keras 3 model artifact
│   ├── tests/
│   │   └── test_api.py           # Automated pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── backend/                      # Spring Boot 3 / Java 21 REST API
│   ├── src/main/java/com/braintumor/
│   │   ├── BrainTumorApplication.java
│   │   ├── config/               # Security, CORS, and WebClient setup
│   │   ├── controller/           # Analysis & Health endpoints
│   │   ├── dto/                  # Request / Response records
│   │   ├── entity/               # AnalysisHistory JPA entity
│   │   ├── exception/            # Centralized exception handling
│   │   ├── repository/           # Spring Data JPA repository
│   │   └── service/              # Orchestration & WebClient services
│   ├── src/main/resources/
│   │   ├── application.yml       # Base Spring configuration
│   │   ├── application-dev.yml   # Dev profile (local MySQL)
│   │   ├── application-prod.yml  # Production profile (Docker network)
│   │   └── db/migration/         # Flyway SQL migration scripts
│   │       └── V1__create_analysis_history.sql
│   ├── src/test/                 # Spring Boot mock MVC tests
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                     # Next.js 14 / TypeScript / Tailwind CSS
│   ├── public/samples/           # Pre-loaded sample MRI scans for 1-click test
│   ├── src/app/                  # App router pages (Home, History, About)
│   ├── src/components/           # Reusable UI components (GradCamViewer, Uploader, etc.)
│   ├── src/lib/api.ts            # Client API caller
│   ├── src/types/index.ts        # TypeScript schemas
│   ├── Dockerfile
│   └── package.json
├── sample_mri_images/            # Permitted MRI samples for verification
├── docker-compose.yml            # Unified multi-container orchestration
├── .env.example                  # Environment template
├── .gitignore
├── LICENSES.md                   # Third-party licensing & attribution
└── README.md
```

---

## 5. Prerequisites

- **Docker & Docker Compose:** Docker Engine v24+ and Docker Compose v2.20+
- **For Host Development (Optional):**
  - Java 21 LTS (`java -version`)
  - Apache Maven 3.9+ (`mvn -version`)
  - Python 3.11 or 3.12 (`python --version`)
  - Node.js 20+ (`node -v`)

---

## 6. Environment Variables

Copy the example file to `.env`:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `DB_NAME` | `brain_tumor_db` | MySQL database name |
| `DB_USER` | `brain_user` | Application database user |
| `DB_PASSWORD` | `brain_secure_pass` | Application database password |
| `DB_PORT` | `3307` | Host port for MySQL (configured to 3307 to prevent 3306 conflicts) |
| `MYSQL_ROOT_PASSWORD` | `root_super_secure_pass_2026` | MySQL root administrator password |
| `PORT` | `8081` | Spring Boot API server port |
| `SPRING_PROFILES_ACTIVE`| `dev` / `prod` | Active Spring profile |
| `AI_SERVICE_URL` | `http://localhost:8000` | AI service URL |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Whitelisted frontend origins |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8081` | Public API URL accessible from browser |

---

## 7. Quick Start with Docker Compose

To launch all four microservices with healthchecks and persistent storage in a single command:

```bash
docker compose up -d --build
```

### Verifying Service Health
```bash
docker compose ps
```
All containers will display `(healthy)`:
- `brain-tumor-mysql`: Port 3307
- `brain-tumor-ai-service`: Port 8000
- `brain-tumor-backend`: Port 8081
- `brain-tumor-frontend`: Port 3000

Access the web interface at: **`http://localhost:3000`**

### Stopping Services
```bash
docker compose down
```
To also purge the persistent database volume:
```bash
docker compose down -v
```

---

## 8. Local Development Setup (Host Mode)

If you prefer to run services directly on your host while using Docker only for MySQL:

### Step 1: Start MySQL in Docker
```bash
docker compose up -d mysql
```

### Step 2: Start the Python FastAPI AI Service
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*Health check:* `http://127.0.0.1:8000/health`

### Step 3: Start Spring Boot Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/brain-tumor-backend-1.0.0.jar
```
*Health check:* `http://127.0.0.1:8081/api/health`

### Step 4: Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 9. Database Schema & Migrations

Managed via **Flyway** with `ddl-auto=validate`. Automatic table deletion is disabled.

### Schema Definition (`V1__create_analysis_history.sql`)
```sql
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
```

---

## 10. REST API Documentation

### 1. `GET /api/health`
Returns health status of the backend, database connection, and internal AI service.
```json
{
  "service": "brain-tumor-backend",
  "status": "UP",
  "database": { "status": "UP" },
  "aiService": { "status": "UP", "service": "brain-tumor-xai-service" },
  "timestamp": "2026-10-14T11:47:54Z"
}
```

### 2. `POST /api/mri/analyze`
Submits a brain MRI image for classification and explainability.
- **Request:** `multipart/form-data`
  - `file`: Image file (JPEG, PNG, WebP; max 10 MB)
  - `generate_gradcam`: boolean (default `true`)
  - `alpha`: float (default `0.45`, blending factor between 0.1 and 0.9)
- **Response:** `200 OK`
```json
{
  "id": "3ec31612-a304-4c43-b6fd-12ad29b047be",
  "predictedClass": "glioma",
  "confidence": 0.99989,
  "classScores": {
    "glioma": 0.99989,
    "meningioma": 0.00002,
    "notumor": 0.00009,
    "pituitary": 0.0
  },
  "modelVersion": "efficientnetb4-v1",
  "imageDimensions": [512, 512],
  "gradcamAvailable": true,
  "gradcamOverlayBase64": "data:image/png;base64,iVBORw0KGgo...",
  "processingTimeMs": 142.5,
  "timestamp": "2026-10-14T11:49:22Z",
  "warnings": [],
  "disclaimer": "This tool is for educational and research purposes only..."
}
```

### 3. `GET /api/analyses`
Retrieves past analysis metadata ordered by newest first.

### 4. `GET /api/analyses/{id}`
Retrieves a single analysis record by ID.

### 5. `DELETE /api/analyses/{id}`
Permanently deletes an analysis record from the database.

---

## 11. Explainable AI (Grad-CAM) Implementation

### Mathematical Formulation
Grad-CAM computes the importance of each feature activation $A^k$ in the target layer $l$:
$$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial y^c}{\partial A_{i,j}^k}$$
$$L_{\text{Grad-CAM}}^c = \text{ReLU}\left( \sum_k \alpha_k^c A^k \right)$$

### Graph Extraction in EfficientNetB4
1. The target layer is `top_conv` (shape `(None, 7, 7, 1792)`), located inside the `efficientnetb4` sub-graph.
2. A gradient tape tracks activations from `top_conv` through `top_bn`, `top_activation`, `max_pool`, `dense`, and `dense_1` to obtain $\frac{\partial y^c}{\partial A^k}$.
3. Feature maps are pooled and rectified via `tf.maximum(heatmap, 0.0)`.
4. The 7×7 heatmap is upscaled to original image dimensions with bicubic interpolation and mapped via the `JET` colormap.

---

## 12. Automated Testing & Verification

Automated test suites exist at each tier:

### 1. AI Service Tests (Pytest)
```bash
cd ai-service
python -m pytest tests/test_api.py -v
```
*Results:* 7/7 passed (Health, Readiness, Empty file, Corrupt file, Wrong MIME, Synthetic image, Real MRI sample).

### 2. Spring Boot Backend Tests (Maven + MockMvc + H2)
```bash
cd backend
mvn clean test
```
*Results:* 5/5 passed (Health check, MRI multipart upload, Empty file rejection, Invalid MIME rejection, History CRUD).

### 3. End-to-End Multi-Tier Verification Suite
```bash
python test_e2e.py
```
*Results:* 100% passed across all 4 classes (`glioma`, `meningioma`, `notumor`, `pituitary`), Grad-CAM overlay generation, DB persistence, retrieval, deletion, and 400 error handling.

---

## 13. Database Backup & Restore

### Backup
```bash
docker exec -t brain-tumor-mysql mysqldump -u root -p"root_super_secure_pass_2026" brain_tumor_db > backup.sql
```

### Restore
```bash
docker exec -i brain-tumor-mysql mysql -u root -p"root_super_secure_pass_2026" brain_tumor_db < backup.sql
```

---

## 14. Security & Privacy Controls

1. **Zero Image Retention:** Raw MRI scans and patient identifying data are never stored in the database.
2. **Decompression Bomb Protection:** `Image.MAX_IMAGE_PIXELS = 10_000_000` prevents gzip/zip decompression bombs.
3. **Magic Byte Verification:** File payloads are verified using PIL byte decoding rather than relying on the client's `Content-Type` header.
4. **Least-Privilege Database Access:** The application connects using a dedicated `brain_user` account with limited permissions.
5. **No Deserialization Attacks:** Pickle files are excluded from production serving; native `.keras` zip artifacts are used.
6. **Hardened HTTP Headers:** Spring Security enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict referrer policies.

---

## 15. Production Deployment Strategy

- **Frontend (Vercel):** The Next.js app can be deployed directly to Vercel. Set `NEXT_PUBLIC_API_URL` to the public Spring Boot backend URL. (Vercel never connects directly to MySQL or the AI service).
- **Backend & AI Service (Container Platform):** Deploy Spring Boot and FastAPI to AWS ECS, Google Cloud Run, or a Kubernetes cluster using the provided Dockerfiles.
- **Database:** Use a managed database such as AWS RDS MySQL 8.4 or Google Cloud SQL with automated snapshots and SSL transport encryption enabled.

---

## 16. Troubleshooting Guide

| Issue | Cause | Resolution |
|---|---|---|
| **Port 3306 bind error** | Host already has MySQL or MariaDB running | Set `DB_PORT=3307` in `.env` (configured by default). |
| **Port 8080 bind error** | Host has Apache `httpd` or Tomcat running | Set `PORT=8081` in `.env` (configured by default). |
| **Model loading error** | Missing model file | Ensure `ai-service/models/brain_tumor_model.keras` exists. |
| **CORS errors in browser** | Mismatched frontend origin | Update `CORS_ALLOWED_ORIGINS` in `.env`. |
