"""Resolve a usable Python executable on Windows (avoids Store stub / missing PATH)."""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path


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
