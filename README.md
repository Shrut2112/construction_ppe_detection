# Construction PPE Detection System

This project is a real-time Personal Protective Equipment (PPE) detection system designed for construction sites. It uses computer vision (YOLO, DeepFace, ReID) to monitor workers, detect safety violations (missing helmets, vests, etc.), and identify workers using facial recognition or appearance embeddings. The system consists of a Python FastAPI backend and a Next.js frontend.

## 🏗️ Project Structure

- **`backend/`**: Contains the FastAPI application and API routes (`fastapi_main.py`), and schemas.
- **`frontend/`**: A Next.js (React) application for the user interface.
- **`database/`**: Database connection and management scripts (`database.py`).
- **`model/`**: Stores ML models (e.g., `best (1).pt` for YOLO).
- **`storage/`**: Directory for storing violation snapshots, face crops, and uploaded videos.
- **`pipeline_service.py`**: Core logic for video processing, tracking, and detection.

## 🚀 Prerequisites

Ensure you have the following installed:
- **Python 3.9+**
- **Node.js** (v18+ recommended) & **npm**
- **PostgreSQL** (running locally)

## 🛠️ Installation & Setup

### 1. Database Setup
The system requires a PostgreSQL database.

1.  Install PostgreSQL and ensure the service is running.
2.  Create a database named `construction_ppe_violation`.
3.  Execute the following SQL commands (or use your preferred tool) to create the necessary tables:

    ```sql
    CREATE TABLE workers (
        id SERIAL PRIMARY KEY,
        display_name TEXT,
        face_embedding FLOAT8[], -- OR specific vector type if using pgvector
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE violations (
        id SERIAL PRIMARY KEY,
        worker_id INT REFERENCES workers(id),
        equipped_items TEXT,
        violated_items TEXT,
        evidence_path TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

    > **Note:** The database configuration is currently located in `database/database.py`. Update the `DB_CONFIG` dictionary with your local credentials if they differ from the defaults (`user='postgres'`, `password='Ris@7219'`).

### 2. Backend Setup

1.  Navigate to the project root directory.
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Ensure the YOLO model is placed in `model/best (1).pt`.

### 3. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## ▶️ Running the Application

You need to run both the backend and frontend servers simultaneously.

### 1. Start the Backend
From the **project root** directory, run:

```bash
python -m uvicorn backend.fastapi_main:app --reload
```
*The backend API will start at `http://127.0.0.1:8000`.*

### 2. Start the Frontend
From the **frontend** directory, run:

```bash
npm run dev
```
*The frontend application will start at `http://localhost:3000`.*

## 💡 Usage

1.  Open your browser and navigate to `http://localhost:3000`.
2.  **Webcam Mode:** The system supports a live webcam stream (via WebSocket `/ws_stream`). Ensure your camera is accessible.
3.  **Upload Video:** Use the upload feature to process pre-recorded video files.
4.  **Violations:** Viewed violations will be listed in the dashboard, showing the worker ID, missing equipment, and a snapshot of the violation.

## 📝 Configuration

-   **Detection Logic:** Adjust thresholds (IoU, Confidence) in `pipeline_service.py`.
-   **Database:** Modify `database/database.py` for connection settings.
-   **Models:** Place new path to weights in `pipeline_service.py` (`MODEL_PATH`) if updating the YOLO model.
