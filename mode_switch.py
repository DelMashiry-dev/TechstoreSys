"""Switch Tech Stores between online (server.py) and offline shell on port 8080."""

from __future__ import annotations

import argparse
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from python_runtime import python_executable

PORT = 8080
ROOT = Path(__file__).resolve().parent
LOG_PATH = ROOT / "mode_switch.log"

CREATE_NEW_CONSOLE = 0x00000010
CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
DETACHED_PROCESS = getattr(subprocess, "DETACHED_PROCESS", 0x00000008)
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0x00000200)


def _log(message: str) -> None:
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{stamp}] {message}"
    try:
        with LOG_PATH.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
    except OSError:
        pass


def port_is_listening(port: int = PORT, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((host, port)) == 0


def kill_port(port: int = PORT) -> None:
    ps = (
        f"$p={port}; "
        f"Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | "
        f"ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps],
        cwd=ROOT,
        capture_output=True,
        check=False,
    )


def kill_techstores_servers(exclude_pid: int | None = None) -> None:
    skip = int(exclude_pid if exclude_pid is not None else os.getpid())
    root_text = str(ROOT).replace("\\", "\\\\")
    ps = (
        "$procs = Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" -ErrorAction SilentlyContinue | "
        "Where-Object { $_.CommandLine -and "
        f"($_.CommandLine -like '*{root_text}*') -and "
        "($_.CommandLine -match 'server\\.py|offline_static_server\\.py') }; "
        f"foreach ($p in $procs) {{ if ($p.ProcessId -ne {skip}) {{ "
        "Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }} }}"
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps],
        cwd=ROOT,
        capture_output=True,
        check=False,
    )
    kill_port(PORT)


def ensure_port_free(timeout: float = 12.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        kill_techstores_servers()
        if not port_is_listening(PORT):
            return True
        time.sleep(0.45)
    return not port_is_listening(PORT)


def start_server(script_name: str, title: str) -> None:
    script = ROOT / script_name
    if not script.is_file():
        raise FileNotFoundError(script)
    py = python_executable()
    if Path(py).name.lower() == "py.exe":
        run_args = [py, "-3", "-u", str(script)]
    else:
        run_args = [py, "-u", str(script)]
    # Use argv form of `start` — the old single-string cmd line often failed to launch Python.
    launch = ["cmd.exe", "/c", "start", title, "cmd", "/k", *run_args]
    _log(f"start_server launch={launch}")
    subprocess.Popen(
        launch,
        cwd=ROOT,
        creationflags=CREATE_NO_WINDOW,
        close_fds=True,
    )


def wait_for_mode(target: str, timeout: float = 45.0) -> bool:
    want_online = target == "online"
    deadline = time.time() + timeout
    while time.time() < deadline:
        if not port_is_listening(PORT):
            time.sleep(0.35)
            continue
        try:
            import urllib.request

            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/api/health", timeout=2.5) as resp:
                body = resp.read().decode("utf-8", errors="replace")
            compact = body.replace(" ", "")
            if want_online and ('"database":true' in compact or '"database": true' in body):
                return True
            if not want_online and ('"offline-shell"' in body or '"offlineShell":true' in compact):
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


def perform_switch(target: str, delay: float = 0.8) -> None:
    target = (target or "").strip().lower()
    if target not in ("online", "offline"):
        raise ValueError("target must be 'online' or 'offline'")

    _log(f"perform_switch start -> {target}")
    time.sleep(delay)

    if not ensure_port_free():
        _log("warning: port 8080 still busy after cleanup")

    script = "server.py" if target == "online" else "offline_static_server.py"
    title = "Tech Stores ONLINE" if target == "online" else "Tech Stores OFFLINE"
    start_server(script, title)
    _log(f"started {script}")

    if wait_for_mode(target):
        _log(f"perform_switch complete -> {target}")
        return

    _log(f"perform_switch timed out waiting for {target} health")


def prepare_server_startup(expected: str) -> None:
    """Clear port 8080 only if something is already listening."""
    if port_is_listening(PORT):
        _log(f"prepare_server_startup clearing port for {expected}")
        ensure_port_free(timeout=6.0)


def request_switch(target: str) -> None:
    """Run switch in a detached helper so the current HTTP response can finish."""
    log_handle = LOG_PATH.open("a", encoding="utf-8")
    py = python_executable()
    if Path(py).name.lower() == "py.exe":
        cmd = [py, "-3", "-u", str(ROOT / "mode_switch.py"), "--perform", target]
    else:
        cmd = [py, "-u", str(ROOT / "mode_switch.py"), "--perform", target]
    subprocess.Popen(
        cmd,
        cwd=ROOT,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        stdout=log_handle,
        stderr=log_handle,
        close_fds=True,
    )


def is_localhost(handler) -> bool:
    host = str(getattr(handler, "client_address", ("",))[0] or "")
    return host in ("127.0.0.1", "::1")


def mode_status_payload(current: str) -> dict:
    return {
        "ok": True,
        "mode": current,
        "online": current == "online",
        "offlineShell": current == "offline-shell",
        "database": current == "online",
        "canSwitch": True,
        "switchEndpoint": "/api/mode/switch",
    }


def handle_mode_switch(handler, current_mode: str, read_json) -> bool:
    """Handle POST /api/mode/switch. Returns True if handled."""
    if not is_localhost(handler):
        handler._send_json(403, {"ok": False, "error": "Mode switch is only allowed from this PC."})
        return True
    try:
        payload = read_json()
        target = str(payload.get("target", "")).strip().lower()
    except Exception as exc:
        handler._send_json(400, {"ok": False, "error": str(exc)})
        return True
    if target not in ("online", "offline"):
        handler._send_json(400, {"ok": False, "error": "target must be 'online' or 'offline'"})
        return True
    want = "online" if target == "online" else "offline-shell"
    if current_mode == want:
        handler._send_json(200, {"ok": True, "already": True, "mode": current_mode, "target": target})
        return True
    request_switch(target)
    handler._send_json(200, {"ok": True, "switching": True, "target": target, "mode": current_mode})
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Switch Tech Stores server mode")
    parser.add_argument("--perform", choices=["online", "offline"])
    args = parser.parse_args()
    if args.perform:
        perform_switch(args.perform)
