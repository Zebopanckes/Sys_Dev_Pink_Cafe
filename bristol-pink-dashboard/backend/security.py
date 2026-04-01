"""Security, validation, and audit helpers for the Flask API."""
from __future__ import annotations

import json
import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Callable

import pandas as pd
from flask import jsonify, request


TOKEN_TTL_HOURS = 8

# Demo users for FR5 role segmentation.
USERS = {
    "manager": {"password": "manager123", "role": "manager"},
    "analyst": {"password": "analyst123", "role": "analyst"},
    "viewer": {"password": "viewer123", "role": "viewer"},
}


@dataclass
class Session:
    username: str
    role: str
    expires_at: datetime


SESSIONS: dict[str, Session] = {}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _audit_log_path() -> str:
    base_dir = os.path.dirname(__file__)
    logs_dir = os.path.join(base_dir, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    return os.path.join(logs_dir, "audit.log")


def write_audit_event(event_type: str, status: str, detail: dict | None = None) -> None:
    payload = {
        "ts": _utcnow().isoformat(),
        "event": event_type,
        "status": status,
        "path": request.path if request else None,
        "method": request.method if request else None,
        "ip": request.remote_addr if request else None,
        "detail": detail or {},
    }
    with open(_audit_log_path(), "a", encoding="utf-8") as f:
        f.write(json.dumps(payload) + "\n")


def create_session(username: str) -> tuple[str, dict]:
    user = USERS[username]
    token = secrets.token_urlsafe(32)
    expires_at = _utcnow() + timedelta(hours=TOKEN_TTL_HOURS)
    SESSIONS[token] = Session(username=username, role=user["role"], expires_at=expires_at)
    return token, {
        "username": username,
        "role": user["role"],
        "expires_at": expires_at.isoformat(),
    }


def delete_session(token: str) -> None:
    SESSIONS.pop(token, None)


def get_session_from_request() -> Session | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "", 1).strip()
    session = SESSIONS.get(token)
    if session is None:
        return None
    if session.expires_at < _utcnow():
        delete_session(token)
        return None
    return session


def require_auth(roles: list[str] | None = None) -> Callable:
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            session = get_session_from_request()
            if session is None:
                write_audit_event("auth_required", "denied", {"reason": "missing_or_invalid_token"})
                return jsonify({"error": "Authentication required"}), 401
            if roles and session.role not in roles:
                write_audit_event(
                    "auth_required",
                    "denied",
                    {"reason": "insufficient_role", "role": session.role, "required": roles},
                )
                return jsonify({"error": "Insufficient permissions"}), 403
            request.user = {"username": session.username, "role": session.role}
            return func(*args, **kwargs)

        return wrapper

    return decorator


def validate_sales_data(sales_data: list[dict]) -> tuple[bool, str]:
    if not isinstance(sales_data, list) or len(sales_data) == 0:
        return False, "sales_data must be a non-empty list"

    required_fields = {"date", "product", "unitsSold"}
    for i, row in enumerate(sales_data):
        if not isinstance(row, dict):
            return False, f"Row {i} must be an object"
        missing = required_fields - set(row.keys())
        if missing:
            return False, f"Row {i} missing required fields: {', '.join(sorted(missing))}"

        product = str(row.get("product", "")).strip()
        if not product:
            return False, f"Row {i} has an empty product"
 
        try:
            parsed_date = pd.to_datetime(row["date"])
            if pd.isna(parsed_date):
                return False, f"Row {i} has invalid date"
        except Exception:
            return False, f"Row {i} has invalid date format"

        try:
            units = float(row["unitsSold"])
        except Exception:
            return False, f"Row {i} has non-numeric unitsSold"
        if units < 0:
            return False, f"Row {i} has negative unitsSold"

    return True, "ok"