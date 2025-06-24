#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Codehub Execution Engine setup..."

# --- Frontend Setup (React with Vite) ---
echo "Installing frontend dependencies..."
npm install

echo "Building frontend application... (Output to ./dist)"
npm run build

# The built frontend will be in ./dist, which FastAPI will serve.
# No need to move it to app/dist as FastAPI is configured to serve from project root's 'dist'.

# --- Backend Setup (FastAPI) ---
echo "Installing backend dependencies..."
pip install -r requirements.txt

# --- Run Application ---
echo "Starting FastAPI backend and serving frontend on port 9000..."
# The app.main:app serves the static files from app/dist, so only one process is needed.
# The --reload flag is useful for development, remove for production.
uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload

echo "Codehub Execution Engine is running! Access it at http://localhost:9000"
