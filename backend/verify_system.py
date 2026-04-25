#!/usr/bin/env python3
"""Run a lightweight end-to-end backend verification against the local API."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = int(os.getenv("VERIFY_PORT", "8001"))
BASE_URL = f"http://{HOST}:{PORT}"

ENDPOINTS = [
    ("GET", "/", None, False),
    ("POST", "/auth/login", {"email": "demo@example.com", "password": "password123"}, False),
    ("GET", "/dashboard/summary", None, True),
    ("GET", "/realtime/demand", None, True),
    ("GET", "/alerts/", None, True),
    ("GET", "/demand/1", None, True),
    ("GET", "/forecast/1", None, True),
    ("GET", "/optimize/1", None, True),
    ("GET", "/impact/1", None, True),
    ("GET", "/locations/recommend", None, True),
    ("GET", "/locations/roi/", None, True),
    ("GET", "/simulate/run", None, True),
]


def wait_for_server(timeout_seconds: int = 20) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            request_json("GET", "/")
            return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("Server did not become ready in time")


def request_json(method: str, path: str, payload: dict | None = None, token: str | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"{method} {path} failed with {exc.code}: {body}") from exc


def main() -> int:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)

    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", HOST, "--port", str(PORT)],
        cwd=ROOT,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        wait_for_server()

        token = None
        failures: list[str] = []

        for method, path, payload, needs_auth in ENDPOINTS:
            try:
                response = request_json(method, path, payload, token if needs_auth else None)
                if path == "/auth/login":
                    token = response["data"]["access_token"]
                print(f"PASS {method} {path}")
            except Exception as exc:
                failures.append(f"{method} {path}: {exc}")
                print(f"FAIL {method} {path}")

        if failures:
            print("\nVerification failures:")
            for failure in failures:
                print(f" - {failure}")
            return 1

        print("\nAll backend verification checks passed.")
        return 0
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    raise SystemExit(main())
