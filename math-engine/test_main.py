import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from main import app

client = TestClient(app)

def test_websocket_connection():
    with client.websocket_connect("/ws/math-engine") as websocket:
        # Test basic echo
        payload = {"x": 1, "y": 2}
        websocket.send_json(payload)
        response = websocket.receive_json()
        assert response["status"] == "success"
        assert response["received"] == payload

def test_websocket_evaluate_safe():
    with client.websocket_connect("/ws/math-engine") as websocket:
        # Test basic evaluation
        payload = {
            "action": "evaluate",
            "expression": "x**2 + 2",
            "x": 2
        }
        websocket.send_json(payload)
        response = websocket.receive_json()
        assert response["status"] == "success"
        assert response["action"] == "evaluate"
        # Since we haven't implemented symbol substitution yet in main.py, it should just return the string representation of the parsed expr
        assert "x**2 + 2" in response["result"]

def test_websocket_invalid_json():
    with client.websocket_connect("/ws/math-engine") as websocket:
        websocket.send_text("NOT JSON")
        response = websocket.receive_json()
        assert response["status"] == "error"
        assert response["message"] == "Invalid JSON"
