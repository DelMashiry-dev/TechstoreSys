"""
Optional Supabase cloud backup for TECHSTORESys.

Keeps local SQLite as the primary database and pushes JSON snapshots to a
Supabase Postgres table via the REST API (service role key).
"""

from __future__ import annotations

import copy
import json
import os
import socket
import threading
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
MACHINE_ID_PATH = ROOT / ".techstores-machine-id"
TABLE = "techstores_snapshots"
DEBOUNCE_SEC = 15

_lock = threading.Lock()
_timer: threading.Timer | None = None
_last_status: dict[str, Any] = {
    "configured": False,
    "enabled": False,
    "lastBackupAt": None,
    "lastRevision": None,
    "lastError": None,
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _env_bool(name: str, default: bool = True) -> bool:
    raw = os.environ.get(name, "").strip().lower()
    if not raw:
        return default
    return raw not in ("0", "false", "no", "off")


def get_config() -> tuple[str, str, bool]:
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    enabled = _env_bool("SUPABASE_BACKUP_ENABLED", True)
    configured = bool(url and key)
    return url, key, configured and enabled


def machine_id() -> str:
    env_id = os.environ.get("TECHSTORES_MACHINE_ID", "").strip()
    if env_id:
        return env_id[:120]
    if MACHINE_ID_PATH.is_file():
        try:
            saved = MACHINE_ID_PATH.read_text(encoding="utf-8").strip()
            if saved:
                return saved[:120]
        except OSError:
            pass
    generated = f"{socket.gethostname()}-{uuid.uuid4().hex[:8]}"
    try:
        MACHINE_ID_PATH.write_text(generated, encoding="utf-8")
    except OSError:
        pass
    return generated[:120]


def status_payload() -> dict[str, Any]:
    url, _, active = get_config()
    with _lock:
        payload = {
            **_last_status,
            "configured": bool(url),
            "enabled": active,
            "machineId": machine_id(),
            "table": TABLE,
            "debounceSeconds": DEBOUNCE_SEC,
        }
    if url:
        payload["projectHost"] = urllib.parse.urlparse(url).netloc
    return payload


def _set_status(**kwargs: Any) -> None:
    with _lock:
        _last_status.update(kwargs)


def _request(
    method: str,
    *,
    query: str = "",
    body: list[dict[str, Any]] | None = None,
    prefer: str | None = None,
) -> Any:
    url, key, active = get_config()
    if not active:
        raise RuntimeError(
            "Supabase backup is not configured. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in .env, then restart the server."
        )

    endpoint = f"{url}/rest/v1/{TABLE}{query}"
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(endpoint, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase HTTP {exc.code}: {detail or exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Supabase connection failed: {exc.reason}") from exc


def push_snapshot(state: dict[str, Any]) -> dict[str, Any]:
    revision = int(state.get("saveRevision") or 0)
    saved_at = str(state.get("savedAt") or utc_now())
    saved_by = str(state.get("savedBy") or "system")
    row = {
        "machine_id": machine_id(),
        "save_revision": revision,
        "saved_at": saved_at,
        "saved_by": saved_by,
        "payload": state,
    }
    result = _request(
        "POST",
        body=[row],
        prefer="return=representation",
    )
    created_at = utc_now()
    if isinstance(result, list) and result:
        created_at = str(result[0].get("created_at") or created_at)
    _set_status(
        configured=True,
        enabled=True,
        lastBackupAt=created_at,
        lastRevision=revision,
        lastError=None,
    )
    return {
        "ok": True,
        "savedAt": created_at,
        "saveRevision": revision,
        "machineId": row["machine_id"],
    }


def fetch_latest_snapshot() -> dict[str, Any] | None:
    query = (
        "?select=machine_id,save_revision,saved_at,saved_by,payload,created_at"
        "&order=save_revision.desc,saved_at.desc"
        "&limit=1"
    )
    rows = _request("GET", query=query)
    if not rows:
        return None
    if not isinstance(rows, list):
        raise RuntimeError("Unexpected Supabase response while loading backup.")
    return rows[0] if rows else None


def schedule_backup(state: dict[str, Any]) -> None:
    global _timer
    _, _, active = get_config()
    if not active:
        return

    snapshot = copy.deepcopy(state)

    def _run() -> None:
        try:
            push_snapshot(snapshot)
        except Exception as exc:
            _set_status(lastError=str(exc))

    with _lock:
        if _timer is not None:
            _timer.cancel()
        _timer = threading.Timer(DEBOUNCE_SEC, _run)
        _timer.daemon = True
        _timer.start()
