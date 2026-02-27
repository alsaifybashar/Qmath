# Interactive Learning: User Guide 

Welcome to the new interactive geometry components for Qmath! This guide explains how to spin up the local environment and test the new `JSXGraphBoard` paired with the AI Math Engine.

## Prerequisites

Ensure you have both Node.js (v20+) for the Next.js frontend, and Python 3.10+ for the math engine backend.

## Starting the Environment

The interactive setup requires two separate development servers running concurrently.

### 1. The FastAPI Math Engine
Open a new terminal window or tab:
```bash
# Navigate to the Python microservice directory
cd math-engine

# Activate the virtual environment
source venv/bin/activate
# Or on Windows: .\venv\Scripts\activate

# Start the uvicorn WebSocket server
uvicorn main:app --reload
```
You should see a message indicating the server is running on `http://127.0.0.1:8000`.

### 2. The Next.js Frontend
Open a second terminal window or tab:
```bash
# From the Qmath root directory
npm run dev
```
Navigate to `http://localhost:3000/test-interactive` in your browser.

## Exploring the Features

1. **The Interactive Preview Page (`/test-interactive`)**
   Upon hovering to the preview page, the top widget `Widget 0: Real-Time Geometry (JSXGraph + AI Streaming)` should display a mathematical coordinate board.
2. **Connection Status Tracker**
   Above the board, you will see a green badge stating **"Math Engine Connected"** if your FastAPI server is running. If it says "Disconnected," verify that `uvicorn` is actively running on port `8000`.
3. **Proximity Gradients (Testing)**
   * Drag the blue point `A` anywhere on the coordinate board.
   * As you drag, notice the raw WebSocket streaming output updating live above the board. The React component is sending algebraic evaluations to the Python backend.
   * **Proximity Activation:** Drag point `A` towards the origin `(0,0)`. When it enters a 1-unit radius of the origin, the point will automatically shift colors from blue to red, demonstrating the "Proximity Gradients" foundational logic where an AI scaffolds a student towards a target solution.
