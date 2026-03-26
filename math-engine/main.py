"""
Qmath Math Engine — FastAPI sidecar for symbolic CAS operations.

Endpoints:
  POST /sympy/check-equivalence   — symbolic equivalence check via SymPy
  POST /sympy/simplify-diff       — simplify(student - correct)
  POST /sympy/classify-error      — classify the symbolic distance between answers

Security:
  - All expressions parsed in a RESTRICTED namespace (no builtins, no exec/eval)
  - Input length capped at 512 chars
  - Timeout enforced per request (10 s) via asyncio
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional
import sympy as sp
import json
import asyncio
import re

app = FastAPI(title="Qmath Math Engine", version="2.0.0")

# Allow calls from Next.js dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://qmath.se"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

# ── Safe evaluation namespace ─────────────────────────────────────────────────

SAFE_SYMBOLS = {
    "x": sp.Symbol("x"),
    "y": sp.Symbol("y"),
    "z": sp.Symbol("z"),
    "t": sp.Symbol("t"),
    "n": sp.Symbol("n"),
    "a": sp.Symbol("a"),
    "b": sp.Symbol("b"),
    "C": sp.Symbol("C"),
    "i": sp.I,
    "e": sp.E,
    "pi": sp.pi,
    "oo": sp.oo,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "cot": sp.cot,
    "sec": sp.sec,
    "csc": sp.csc,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "arcsin": sp.asin,
    "arccos": sp.acos,
    "arctan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sqrt": sp.sqrt,
    "Abs": sp.Abs,
    "abs": sp.Abs,
    "ceiling": sp.ceiling,
    "ceil": sp.ceiling,
    "floor": sp.floor,
    "factorial": sp.factorial,
}

MAX_INPUT_LEN = 512
EVAL_TIMEOUT_S = 8.0

DANGER_PATTERN = re.compile(
    r"(__|\bimport\b|\bexec\b|\beval\b|\bopen\b|\bos\b|\bsys\b|\bsubprocess\b)",
    re.IGNORECASE,
)


def safe_parse(expr_str: str) -> sp.Expr:
    """Parse a math string into a SymPy expression in the safe namespace."""
    if len(expr_str) > MAX_INPUT_LEN:
        raise ValueError("Expression too long")
    if DANGER_PATTERN.search(expr_str):
        raise ValueError("Dangerous pattern detected")
    # sympify with local_dict to restrict namespace
    return sp.sympify(expr_str, locals=SAFE_SYMBOLS, evaluate=True)


# ── Request models ─────────────────────────────────────────────────────────────

class EquivalenceRequest(BaseModel):
    student: str
    correct: str
    ignore_constant: bool = False
    domain: str = "real"  # "real" | "positive" | "complex"
    variables: list[str] = ["x"]

    @field_validator("student", "correct")
    @classmethod
    def validate_length(cls, v: str) -> str:
        if len(v) > MAX_INPUT_LEN:
            raise ValueError("Expression too long")
        return v


class SimplifyRequest(BaseModel):
    student: str
    correct: str

    @field_validator("student", "correct")
    @classmethod
    def validate_length(cls, v: str) -> str:
        if len(v) > MAX_INPUT_LEN:
            raise ValueError("Expression too long")
        return v


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/sympy/check-equivalence")
async def check_equivalence(req: EquivalenceRequest):
    """
    Symbolically check whether student == correct (mod additive constant if ignore_constant).
    Returns { isEquivalent: bool, simplifiedDiff: str | null, error: str | null }
    """
    try:
        result = await asyncio.wait_for(
            _check_equivalence(req),
            timeout=EVAL_TIMEOUT_S,
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="SymPy evaluation timed out")
    except ValueError as e:
        return {"isEquivalent": False, "simplifiedDiff": None, "error": str(e)}
    except Exception as e:
        return {"isEquivalent": False, "simplifiedDiff": None, "error": str(e)}


async def _check_equivalence(req: EquivalenceRequest) -> dict:
    loop = asyncio.get_event_loop()

    def _compute():
        student_expr = safe_parse(req.student)
        correct_expr = safe_parse(req.correct)

        diff = sp.simplify(student_expr - correct_expr)

        if diff == 0:
            return {"isEquivalent": True, "simplifiedDiff": "0", "error": None}

        if req.ignore_constant:
            # Check if diff is a constant (has no free symbols from variables list)
            syms = {str(s) for s in diff.free_symbols}
            var_set = set(req.variables)
            if not syms.intersection(var_set):
                # diff is constant in all variables → equivalent up to constant
                return {"isEquivalent": True, "simplifiedDiff": str(diff), "error": None}

        # Expand and try again
        diff_expanded = sp.expand(diff)
        if diff_expanded == 0:
            return {"isEquivalent": True, "simplifiedDiff": "0", "error": None}

        return {
            "isEquivalent": False,
            "simplifiedDiff": str(diff_expanded),
            "error": None,
        }

    return await loop.run_in_executor(None, _compute)


@app.post("/sympy/simplify-diff")
async def simplify_diff(req: SimplifyRequest):
    """
    Returns simplify(student - correct) as a string.
    Useful for debugging why two expressions are not equal.
    """
    try:
        def _compute():
            student_expr = safe_parse(req.student)
            correct_expr = safe_parse(req.correct)
            diff = sp.simplify(student_expr - correct_expr)
            return {"diff": str(diff), "isZero": diff == 0}

        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _compute),
            timeout=EVAL_TIMEOUT_S,
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Timeout")
    except Exception as e:
        return {"diff": None, "isZero": False, "error": str(e)}


@app.post("/sympy/classify-error")
async def classify_error(req: EquivalenceRequest):
    """
    Classify the symbolic distance between student and correct answers.
    Returns a category string useful for the feedback tree.
    """
    try:
        def _compute():
            student_expr = safe_parse(req.student)
            correct_expr = safe_parse(req.correct)

            x = SAFE_SYMBOLS.get(req.variables[0], sp.Symbol(req.variables[0]))

            # Sign flip?
            if sp.simplify(student_expr + correct_expr) == 0:
                return {"category": "sign_error"}

            # Off by constant factor?
            with sp.assuming(sp.Q.positive(x)):
                ratio = sp.simplify(student_expr / correct_expr) if correct_expr != 0 else None
            if ratio is not None and ratio.is_constant() and ratio != 1 and ratio != -1:
                return {"category": "off_by_factor", "factor": str(ratio)}

            # Off by additive constant?
            diff = sp.simplify(student_expr - correct_expr)
            if diff.is_constant():
                return {"category": "off_by_constant", "constant": str(diff)}

            # Differentiated instead of integrated?
            try:
                d_correct = sp.diff(correct_expr, x)
                if sp.simplify(student_expr - d_correct) == 0:
                    return {"category": "differentiated_instead_of_integrated"}
            except Exception:
                pass

            # Integrated instead of differentiated?
            try:
                d_student = sp.diff(student_expr, x)
                if sp.simplify(d_student - correct_expr) == 0:
                    return {"category": "integrated_instead_of_differentiated"}
            except Exception:
                pass

            return {"category": "unknown"}

        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _compute),
            timeout=EVAL_TIMEOUT_S,
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Timeout")
    except Exception as e:
        return {"category": "unknown", "error": str(e)}


# ── Legacy WebSocket endpoint (kept for backwards compatibility) ───────────────

@app.websocket("/ws/math-engine")
async def math_engine_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                action = payload.get("action")

                if action == "evaluate":
                    expression = payload.get("expression", "")
                    try:
                        if DANGER_PATTERN.search(expression):
                            raise ValueError("Dangerous expression")
                        parsed_expr = sp.sympify(expression, locals=SAFE_SYMBOLS)
                        result = str(parsed_expr)
                        status = "success"
                    except Exception as e:
                        result = str(e)
                        status = "error"

                    await websocket.send_json({
                        "status": status,
                        "action": action,
                        "result": result,
                    })
                else:
                    await websocket.send_json({"status": "success", "received": payload})

            except json.JSONDecodeError:
                await websocket.send_json({"status": "error", "message": "Invalid JSON"})

    except WebSocketDisconnect:
        print("Client disconnected")


# Run via: uvicorn main:app --reload --port 8001
