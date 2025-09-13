# Toddler Detection Monitoring App

This is a local desktop application built with Electron, React, and a FastAPI (Python) backend for real-time object detection on a video stream.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Python](https://www.python.org/) (v3.8 or later) with `pip`

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/VishnuVardhanBR/vigil-inference
    cd toddler-monitor-app
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the Python environment:**
    It is highly recommended to use a virtual environment.
    ```bash
    # Create a virtual environment
    python -m venv backend/venv

    # Activate it
    # On Windows:
    backend\venv\Scripts\activate
    # On macOS/Linux:
    source backend/venv/bin/activate
    ```

4.  **Install Python dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

5.  **Add Model and Video:**
    -   Place your trained YOLO model (e.g., `your_model.pt`) inside the `/backend` folder.
    -   Place your test video file (e.g., `test_video.mp4`) inside the `/backend` folder.
    -   **IMPORTANT:** Open `backend/main.py` and update the `MODEL_PATH` and `VIDEO_PATH` variables to match your filenames.

## Running the Application (Development)

This command will start the Python backend, the React frontend dev server, and the Electron application all at once.

```bash
npm run dev
```

The application window should appear, connect to the backend, and start streaming the processed video.
