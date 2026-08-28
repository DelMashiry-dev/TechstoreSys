#!/usr/bin/env python3
"""
Tech Stores offline shell — serves the web app at http://127.0.0.1:8080/app/
without the full SQLite API. The browser uses IndexedDB + cached modules.

Use when you have no network or want to stop the main database server but still
open the same URL in the browser. Data saves locally and syncs when you run
START-SYSTEM.bat again.

  python offline_static_server.py
  or double-click START-OFFLINE.bat
"""

from __future__ import annotations

import json
import mimetypes
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from mode_switch import (
    handle_mode_switch,
    mode_status_payload,
    prepare_server_startup,
    existing_http_ready,
    wait_as_prelaunch_placeholder,
)
from python_runtime import runtime_root

ROOT = runtime_root()
APP_INDEX = "app/index.html"
HOST = "0.0.0.0"
PORT = 8080

OFFLINE_API_BODY = b'{"ok":false,"error":"Offline shell - data saved in browser storage"}'


class OfflineShellHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        if args and str(args[-1]).startswith("2"):
            return
        super().log_message(fmt, *args)

    def _send(self, code: int, data: bytes, content_type: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, code: int, body: bytes | dict | list = OFFLINE_API_BODY) -> None:
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self._send(code, body, "application/json; charset=utf-8")

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _serve_file(self, rel: str) -> None:
        rel = rel.replace("\\", "/").lstrip("/")
        if ".." in rel.split("/"):
            self._send_json(400)
            return
        file_path = (ROOT / rel).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():
            self._send_json(404)
            return
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        suffix = file_path.suffix.lower()
        if suffix == ".html":
            content_type = "text/html; charset=utf-8"
        elif suffix == ".js":
            content_type = "application/javascript; charset=utf-8"
        elif suffix == ".css":
            content_type = "text/css; charset=utf-8"
        elif suffix == ".webmanifest":
            content_type = "application/manifest+json; charset=utf-8"
        self._send(200, file_path.read_bytes(), content_type)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path == "/api/health":
            self._send_json(200, b'{"ok":true,"mode":"offline-shell","offlineShell":true,"database":false}')
            return
        if path == "/api/mode":
            self._send_json(200, mode_status_payload("offline-shell"))
            return
        if path.startswith("/api/"):
            self._send_json(503)
            return
        if path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/app/")
            self.end_headers()
            return
        if path in ("/app", "/app/"):
            self._serve_file(APP_INDEX)
            return
        self._serve_file(path.lstrip("/"))

    def do_PUT(self) -> None:
        if urlparse(self.path).path == "/api/state":
            self._send_json(503)
            return
        self._send_json(404)

    def do_POST(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path == "/api/mode/switch":
            handle_mode_switch(self, "offline-shell", self._read_json)
            return
        if path.startswith("/api/"):
            self._send_json(503)
            return
        self._send_json(404)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    print(" Starting Tech Stores Offline Shell…", flush=True)
    if existing_http_ready(PORT, mode="offline-shell"):
        print(f" Offline shell already running at http://127.0.0.1:{PORT}/app/", flush=True)
        print("TECHSTORES_OFFLINE_READY", flush=True)
        wait_as_prelaunch_placeholder()
        return

    prepare_server_startup("offline-shell")
    try:
        httpd = ThreadingHTTPServer((HOST, PORT), OfflineShellHandler)
    except OSError as exc:
        if existing_http_ready(PORT, mode="offline-shell"):
            print(f" Offline shell already running at http://127.0.0.1:{PORT}/app/", flush=True)
            print("TECHSTORES_OFFLINE_READY", flush=True)
            wait_as_prelaunch_placeholder()
            return
        print(f" ERROR: could not bind port {PORT}: {exc}", flush=True)
        sys.exit(1)
    url = f"http://127.0.0.1:{PORT}/app/"
    print("=" * 60)
    print(" IT-DIR Tech Stores — OFFLINE SHELL")
    print("=" * 60)
    print(f" Open:     {url}")
    print(" Storage:  browser IndexedDB (syncs when START-SYSTEM.bat runs)")
    print(" Tip:      use the app online once first to cache modules.")
    print(" Press Ctrl+C to stop")
    print("=" * 60)
    print("TECHSTORES_OFFLINE_READY", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nOffline shell stopped.")


if __name__ == "__main__":
    main()
