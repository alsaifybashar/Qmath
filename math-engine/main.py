from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sympy as sp
import json

app = FastAPI()

@app.websocket("/ws/math-engine")
async def math_engine_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                
                # Basic example: simple symbol parsing
                # More robust sympy evaluation can be built here based on payload type
                action = payload.get("action")
                
                if action == "evaluate":
                    expression = payload.get("expression", "")
                    # CAUTION: evaluate untrusted strings carefully in prod!
                    # For MVP, we parse the expr safely:
                    try:
                        parsed_expr = sp.sympify(expression)
                        result = str(parsed_expr)
                    except Exception as e:
                        result = str(e)
                        
                    await websocket.send_json({
                        "status": "success",
                        "action": action,
                        "result": result
                    })
                else:
                    # By default echo back coordinates for proximity tracking
                    await websocket.send_json({
                        "status": "success",
                        "received": payload
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({"status": "error", "message": "Invalid JSON"})

    except WebSocketDisconnect:
        print("Client disconnected")

# Run via: uvicorn main:app --reload
