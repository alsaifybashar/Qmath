# Interactive Learning Architecture

## Overview
The Qmath platform integrates a real-time, mathematically deterministic interactive layer using **JSXGraph** on the frontend and **SymPy** via a dedicated **FastAPI WebSocket service** on the backend. This allows the system to "watch" a student think and evaluate geometric inputs dynamically.

## Component Architecture

1.  **Frontend (Next.js & React)**
    *   **`JSXGraphBoard`**: A React wrapper component (`components/interactive/JSXGraphBoard.tsx`) that mounts and unmounts the JSXGraph core library cleanly within the Next.js component lifecycle. It handles dimensioning, basic styling (dark/light mode via Tailwind), and prevents re-render thrashing.
    *   **`useGraphStream`**: A custom React Hook (`lib/hooks/useGraphStream.ts`) that manages a persistent WebSocket connection to the `math-engine`. It exposes a `streamState` function to securely broadcast geometry changes (like drag events) locally to the backend.

2.  **Backend (Python FastAPI / math-engine)**
    *   **Service**: A lightweight microservice running on `uvicorn` containing the core logic (`math-engine/main.py`).
    *   **Computation**: Utilizes `sympy` to evaluate incoming mathematical expressions safely.
    *   **Communication**: Maintains full-duplex WebSocket connections (`/ws/math-engine`) to process interactive board states from the frontend with near-zero latency.

## Data Flow (Proximity Gradients Example)
1.  User drags a point `A` on the `JSXGraphBoard`.
2.  The `drag` event triggers an evaluation payload containing the point's coordinates (`X`, `Y`) and an algebraic expression.
3.  `useGraphStream` sends this payload via WebSocket.
4.  `math-engine` receives the payload, optionally runs it through SymPy for formal mathematical validation (e.g., checking if point `A` resides on a specific curve).
5.  Based on proximity logic (currently handled on the client in MVP, but built for server-side evaluation), the color of point `A` shifts (e.g., from blue to red) as it nears the target geometric state.

## Security Considerations
*   **Input Sanitization**: The math-engine uses SymPy's `sympify` instead of raw Python `eval()` to prevent Python code injection attacks via the WebSocket payload.
*   **JSON Validation**: Incoming WebSocket messages are strictly parsed as JSON; malformed packets are caught and discarded.
*   **Local Execution**: During development, the engine listens on `127.0.0.1:8000`. In production, this service should be containerized and isolated within the backend VPC, accessed only via an authenticated API Gateway or reverse proxy.
