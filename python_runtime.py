"""Resolve a usable Python executable on Windows (avoids Store stub / missing PATH)."""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

FROZEN_SERVER_EXES = {
    "server.py": "TECHSTORES.exe",
    "offline_static_server.py": "TECHSTORES-OFFLINE.exe",
}
FROZEN_MODE_EXE = "TECHSTORES-MODE.exe"
FROZEN_LAUNCHER_EXE = "TECHSTORES-LAUNCHER.exe"


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def runtime_root() -> Path:
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def frozen_server_exe(script_name: str) -> Path | None:
    name = FROZEN_SERVER_EXES.get(script_name)
    if not name:
        return None
    exe = runtime_root() / name
    return exe if exe.is_file() else None


def python_executable() -> str:
    exe = Path(sys.executable)
    if exe.is_file() and exe.name.lower() in ("python.exe", "pythonw.exe"):
        if "windowsapps" not in str(exe).lower():
            return str(exe)

    env = os.environ.get("TECHSTORES_PYTHON", "").strip()
    if env:
        p = Path(env)
        if p.is_file():
            return str(p)

    py_launcher = shutil.which("py")
    if py_launcher:
        return py_launcher

    for name in ("python", "python3"):
        found = shutil.which(name)
        if found and "windowsapps" not in found.lower():
            return found

    for ver in ("313", "312", "311", "310"):
        candidate = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Python" / f"Python{ver}" / "python.exe"
        if candidate.is_file():
            return str(candidate)

    return str(exe)


def python_command(script: Path, extra_args: list[str] | None = None) -> list[str]:
    py = python_executable()
    args = list(extra_args or [])
    if Path(py).name.lower() == "py.exe":
        return [py, "-3", "-u", str(script), *args]
    return [py, "-u", str(script), *args]
