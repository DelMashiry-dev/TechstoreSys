#!/usr/bin/env python3
"""
Tech Stores mode launcher — always-on helper on port 8765.
Lets the login-page toggle start online/offline servers on 8080 even when none is running.
"""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from mode_switch import is_localhost, perform_switch
from python_runtime import runtime_root

HOST = "127.0.0.1"
PORT = 8765
ROOT = runtime_root()


class LauncherHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        if args and str(args[-1]).startswith("2"):
            return
        super().log_message(fmt, *args)

    def _send(self, status: int, body: bytes, content_type: str = "application/json; charset=utf-8") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, payload: dict) -> None:
        self._send(status, json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self) -> None:
        self._send(204, b"", "text/plain")

    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path == "/api/health":
            self._send_json(200, {
                "ok": True,
                "mode": "launcher",
                "launcher": True,
                "database": False,
                "port": PORT,
            })
            return
        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path != "/api/mode/switch":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return
        if not is_localhost(self):
            self._send_json(403, {"ok": False, "error": "Mode switch is only allowed from this PC."})
            return
        try:
            payload = self._read_json()
            target = str(payload.get("target", "")).strip().lower()
        except Exception as exc:
            self._send_json(400, {"ok": False, "error": str(exc)})
            return
        if target not in ("online", "offline"):
            self._send_json(400, {"ok": False, "error": "target must be 'online' or 'offline'"})
            return

        def _run() -> None:
            try:
                perform_switch(target, delay=0.2)
            except Exception as exc:
                from mode_switch import _log
                _log(f"launcher perform_switch failed: {exc}")

        threading.Thread(target=_run, daemon=True).start()
        self._send_json(200, {"ok": True, "switching": True, "target": target, "via": "launcher"})


def main() -> None:
    httpd = ThreadingHTTPServer((HOST, PORT), LauncherHandler)
    print(f"Tech Stores mode launcher on http://{HOST}:{PORT}/", flush=True)
    print("TECHSTORES_LAUNCHER_READY", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Launcher stopped.")


if __name__ == "__main__":
    main()
