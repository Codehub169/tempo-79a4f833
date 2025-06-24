#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Codehub Execution Engine setup..."

# --- Frontend Setup (React with Vite) ---
echo "Installing frontend dependencies..."
cd src
npm install

echo "Building frontend application..."
npm run build
cd ..

# Move the built frontend to the 'app/dist' directory for FastAPI to serve.
# Ensure 'app/dist' exists before moving.
mkdir -p app/dist
rm -rf app/dist/*
mv dist/* app/dist/

# --- Backend Setup (FastAPI) ---
echo "Installing backend dependencies..."
pip install -r requirements.txt

# --- Run Application ---
echo "Starting FastAPI backend and serving frontend on port 9000..."
# The app.main:app serves the static files from app/dist, so only one process is needed.
# The --reload flag is useful for development, remove for production.
uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload

echo "Codehub Execution Engine is running! Access it at http://localhost:9000"
