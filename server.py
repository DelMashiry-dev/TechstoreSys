#!/usr/bin/env python3
"""
IT-DIR Tech Stores — local demo server with SQLite database.
Serves the web app and stores all form data in techstores.db
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import secrets
import sqlite3
import sys
import threading
import uuid
import webbrowser
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse, parse_qs

from product_specs_lookup import lookup_product_specs, lookup_market_catalog, fetch_rbz_usd_zig_rate
from ai_services import ai_status, parse_spec_document, answer_stores_question, draft_requisition_justification
from mode_switch import handle_mode_switch, mode_status_payload, prepare_server_startup

try:
    from version import APP_VERSION, APP_NAME
except ImportError:
    APP_VERSION = "1.0.0.0"
    APP_NAME = "IT-DIR Tech Stores"

HOST = "0.0.0.0"
PORT = 8080


def _runtime_root() -> Path:
    """Folder that holds techstores.db and (for portable builds) the app/ assets."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


ROOT = _runtime_root()
DB_PATH = ROOT / "techstores.db"
APP_INDEX = "app/index.html"
PBKDF2_ITERATIONS = 120_000

# Client appState keys persisted as one JSON blob in settings (beyond users/budgets/modules/cuts)
EXTENDED_STATE_KEYS = (
    "glMonthlyTargets",
    "glTargetViewMonth",
    "storesInventory",
    "customInventoryLedgers",
    "customCatalogItems",
    "stockTakes",
    "monthlyReturns",
    "ictAccountability",
    "ictDistributionLists",
    "ictDistributionActiveId",
    "requisitions",
    "orderlyDailyFile",
    "correspondenceFiles",
    "correspondenceHandovers",
    "undeliveredOrders",
    "supplierDebts",
    "supplierDebtSeedRev",
    "workshopReceiptCerts",
    "dpProcurements",
    "costComparativeSchedules",
    "unitChecks",
    "unitNews",
    "alertDesk",
    "officeMessages",
    "ictCompareHistory",
    "navMenuOrder",
    "saveRevision",
    "savedAt",
    "savedBy",
)

DEFAULT_PLAIN_PASSWORDS = {
    "admin": "admin123",
    "store": "store123",
    "viewer": "view123",
    "commander": "cmd123",
    "briggs": "gs123",
    "brigas": "as123",
    "brigqs": "qs123",
    "dir": "dir123",
    "dd": "dd123",
    "aqso2": "aqso2123",
    "aiad": "aiad123",
    "daf": "daf123",
    "dp": "dp123",
    "tso": "tso123",
    "rq": "rq123",
    "orderly": "orderly123",
    "storeman": "storeman123",
    "rp": "rp123",
    "workshop": "workshop123",
    "sysadmin": "sysadmin123",
    "dba": "dba123",
    "swengr": "swengr123",
    "ictsec": "ictsec123",
    "itts": "itts123",
    "ao": "ao123",
    "gate": "gate123",
}

# Friendly login labels → real usernames
LOGIN_USERNAME_ALIASES = {
    "rp gate": "rp",
    "rpgate": "rp",
    "rp_gate": "rp",
    "regimental police": "rp",
    "gate desk": "gate",
    "gate rp": "gate",
    "gaterp": "gate",
}

# Extra accepted passwords for demo accounts (normalized, no spaces)
LOGIN_PASSWORD_ALIASES = {
    "rp": {"rp123", "rpgate123"},
    "gate": {"gate123", "rpgate123"},
}


def normalize_login_key(value: str) -> str:
    return " ".join(str(value or "").strip().lower().replace("_", " ").replace("-", " ").split())


def resolve_login_username(username: str) -> str:
    raw = str(username or "").strip()
    if not raw:
        return ""
    key = normalize_login_key(raw)
    compact = key.replace(" ", "")
    if key in LOGIN_USERNAME_ALIASES:
        return LOGIN_USERNAME_ALIASES[key]
    if compact in LOGIN_USERNAME_ALIASES:
        return LOGIN_USERNAME_ALIASES[compact]
    for user in DEFAULT_USERS:
        if str(user.get("username") or "").lower() == raw.lower():
            return str(user["username"])
    return raw.lower()


def password_accepted_for_user(username: str, password: str, stored: str) -> bool:
    pwd = str(password or "").strip()
    if verify_password(pwd, stored):
        return True
    user_key = str(username or "").strip().lower()
    expected = DEFAULT_PLAIN_PASSWORDS.get(user_key)
    if expected and pwd.lower() == expected.lower():
        return True
    aliases = LOGIN_PASSWORD_ALIASES.get(user_key) or set()
    norm = normalize_login_key(pwd).replace(" ", "")
    return norm in aliases

DEFAULT_USERS = [
    {
        "id": "u-admin",
        "username": "admin",
        "password": "admin123",
        "name": "System Administrator",
        "role": "admin",
        "active": True,
    },
    {
        "id": "u-cmd",
        "username": "commander",
        "password": "cmd123",
        "name": "Army Commander",
        "role": "army_commander",
        "active": True,
    },
    {
        "id": "u-briggs",
        "username": "briggs",
        "password": "gs123",
        "name": "Brigadier GS",
        "role": "brig_gs",
        "active": True,
    },
    {
        "id": "u-brigas",
        "username": "brigas",
        "password": "as123",
        "name": "Brigadier AS",
        "role": "brig_as",
        "active": True,
    },
    {
        "id": "u-brigqs",
        "username": "brigqs",
        "password": "qs123",
        "name": "Brigadier QS",
        "role": "brig_qs",
        "active": True,
    },
    {
        "id": "u-dir",
        "username": "dir",
        "password": "dir123",
        "name": "Director IT Dir",
        "role": "director",
        "active": True,
    },
    {
        "id": "u-dd",
        "username": "dd",
        "password": "dd123",
        "name": "Deputy Director",
        "role": "deputy_director",
        "active": True,
    },
    {
        "id": "u-aqso2",
        "username": "aqso2",
        "password": "aqso2123",
        "name": "AQSO2",
        "role": "aqso2",
        "active": True,
    },
    {
        "id": "u-aiad",
        "username": "aiad",
        "password": "aiad123",
        "name": "Director AIAD",
        "role": "dir_aiad",
        "active": True,
    },
    {
        "id": "u-daf",
        "username": "daf",
        "password": "daf123",
        "name": "Director DAF",
        "role": "dir_daf",
        "active": True,
    },
    {
        "id": "u-dp",
        "username": "dp",
        "password": "dp123",
        "name": "Director DP",
        "role": "dir_dp",
        "active": True,
    },
    {
        "id": "u-tso",
        "username": "tso",
        "password": "tso123",
        "name": "TechStores Officer",
        "role": "techstores_officer",
        "active": True,
    },
    {
        "id": "u-rq",
        "username": "rq",
        "password": "rq123",
        "name": "Regimental Quartermaster",
        "role": "rq",
        "active": True,
    },
    {
        "id": "u-store",
        "username": "store",
        "password": "store123",
        "name": "Store Officer",
        "role": "store_officer",
        "active": True,
    },
    {
        "id": "u-orderly",
        "username": "orderly",
        "password": "orderly123",
        "name": "Chief Clerk / Orderly Room",
        "role": "orderly_clerk",
        "active": True,
    },
    {
        "id": "u-storeman",
        "username": "storeman",
        "password": "storeman123",
        "name": "Storeman",
        "role": "storeman",
        "active": True,
    },
    {
        "id": "u-rp",
        "username": "rp",
        "password": "rp123",
        "name": "RP Gate",
        "role": "rp",
        "active": True,
    },
    {
        "id": "u-workshop",
        "username": "workshop",
        "password": "workshop123",
        "name": "Workshop NCO",
        "role": "workshop",
        "active": True,
    },
    {
        "id": "u-sysadmin",
        "username": "sysadmin",
        "password": "sysadmin123",
        "name": "OC Systems Administration",
        "role": "oc_sysadmin",
        "active": True,
    },
    {
        "id": "u-dba",
        "username": "dba",
        "password": "dba123",
        "name": "OC Computer Engineering / DBA",
        "role": "oc_compengr",
        "active": True,
    },
    {
        "id": "u-swengr",
        "username": "swengr",
        "password": "swengr123",
        "name": "OC Software Engineering",
        "role": "oc_swengr",
        "active": True,
    },
    {
        "id": "u-ictsec",
        "username": "ictsec",
        "password": "ictsec123",
        "name": "OC ICT Security",
        "role": "oc_ictsec",
        "active": True,
    },
    {
        "id": "u-itts",
        "username": "itts",
        "password": "itts123",
        "name": "OC ITTS",
        "role": "oc_itts",
        "active": True,
    },
    {
        "id": "u-ao",
        "username": "ao",
        "password": "ao123",
        "name": "Admin Office / AO",
        "role": "oc_admin",
        "active": True,
    },
    {
        "id": "u-gate",
        "username": "gate",
        "password": "gate123",
        "name": "Gate Desk",
        "role": "oc_gate",
        "active": True,
    },
    {
        "id": "u-viewer",
        "username": "viewer",
        "password": "view123",
        "name": "Read Only Viewer",
        "role": "viewer",
        "active": True,
    },
]

DEFAULT_BUDGETS = {
    "2200600002": 50000,
    "2200600003": 25000,
    "220200002": 35000,
    "2201900002": 20000,
    "3112210001": 100000,
}

_db_lock = threading.Lock()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"pbkdf2${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    if not stored:
        return False
    if stored.startswith("pbkdf2$"):
        try:
            _, iterations, salt, digest = stored.split("$", 3)
            check = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                bytes.fromhex(salt),
                int(iterations),
            ).hex()
            return secrets.compare_digest(check, digest)
        except Exception:
            return False
    # Legacy plaintext support during migration
    return secrets.compare_digest(password, stored)


def normalize_password_for_storage(new_password: str | None, existing_hash: str | None = None) -> str:
    pwd = (new_password or "").strip()
    if not pwd or pwd == "********":
        return existing_hash or hash_password(secrets.token_urlsafe(12))
    if pwd.startswith("pbkdf2$"):
        return pwd
    return hash_password(pwd)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    # Durable on-disk persistence (survives power-off / logout)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn


def init_db() -> None:
    with _db_lock:
        conn = get_conn()
        try:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS gl_budgets (
                    gl_code TEXT PRIMARY KEY,
                    budget REAL NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS modules (
                    module_id TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS release_cuts (
                    id TEXT PRIMARY KEY,
                    transfer_date TEXT,
                    from_gl TEXT,
                    to_gl TEXT,
                    amount REAL,
                    reason TEXT,
                    authorized_by TEXT,
                    processed_at TEXT,
                    payload TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    detail TEXT,
                    username TEXT,
                    created_at TEXT NOT NULL
                );
                """
            )

            # Existing DBs: add username column for audit trail
            audit_cols = {
                r[1]
                for r in conn.execute("PRAGMA table_info(audit_log)").fetchall()
            }
            if "username" not in audit_cols:
                conn.execute("ALTER TABLE audit_log ADD COLUMN username TEXT")

            user_count = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
            if user_count == 0:
                now = utc_now()
                conn.executemany(
                    """
                    INSERT INTO users (id, username, password, name, role, active, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        (
                            u["id"],
                            u["username"],
                            hash_password(u["password"]),
                            u["name"],
                            u["role"],
                            1 if u.get("active", True) else 0,
                            now,
                        )
                        for u in DEFAULT_USERS
                    ],
                )
            else:
                # Existing DBs may pre-date newer demo roles — insert any missing usernames
                now = utc_now()
                for u in DEFAULT_USERS:
                    exists = conn.execute(
                        "SELECT 1 FROM users WHERE lower(username) = lower(?)",
                        (u["username"],),
                    ).fetchone()
                    if exists:
                        continue
                    conn.execute(
                        """
                        INSERT INTO users (id, username, password, name, role, active, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            u["id"],
                            u["username"],
                            hash_password(u["password"]),
                            u["name"],
                            u["role"],
                            1 if u.get("active", True) else 0,
                            now,
                        ),
                    )

            budget_count = conn.execute("SELECT COUNT(*) AS c FROM gl_budgets").fetchone()["c"]
            if budget_count == 0:
                now = utc_now()
                conn.executemany(
                    """
                    INSERT INTO gl_budgets (gl_code, budget, updated_at)
                    VALUES (?, ?, ?)
                    """,
                    [(code, amount, now) for code, amount in DEFAULT_BUDGETS.items()],
                )

            if conn.execute("SELECT COUNT(*) AS c FROM settings").fetchone()["c"] == 0:
                conn.execute(
                    "INSERT INTO settings (key, value) VALUES (?, ?)",
                    ("theme", json.dumps("normal")),
                )
                conn.execute(
                    "INSERT INTO settings (key, value) VALUES (?, ?)",
                    ("version", json.dumps(2)),
                )

            # Migrate any legacy plaintext passwords to PBKDF2 hashes
            for row in conn.execute("SELECT id, password FROM users"):
                pwd = row["password"] or ""
                if pwd and not pwd.startswith("pbkdf2$"):
                    conn.execute(
                        "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
                        (hash_password(pwd), utc_now(), row["id"]),
                    )

            # must_change_password column (kept for later; renewal disabled in development)
            cols = {
                r[1]
                for r in conn.execute("PRAGMA table_info(users)").fetchall()
            }
            if "must_change_password" not in cols:
                conn.execute(
                    "ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0"
                )
            conn.execute("UPDATE users SET must_change_password = 0")

            conn.execute(
                "INSERT INTO audit_log (action, detail, username, created_at) VALUES (?, ?, ?, ?)",
                ("server_start", f"Database ready at {DB_PATH.name}", "system", utc_now()),
            )
            conn.commit()
        finally:
            conn.close()


def public_user(row: sqlite3.Row | dict, include_secret: bool = False) -> dict:
    data = dict(row) if not isinstance(row, dict) else row
    must = data.get("must_change_password", 0)
    payload = {
        "id": data["id"],
        "username": data["username"],
        "name": data["name"],
        "role": data["role"],
        "active": bool(data["active"]) if not isinstance(data["active"], bool) else data["active"],
        "passwordSet": bool(data.get("password")),
        "mustChangePassword": bool(int(must)) if must is not None and must != "" else False,
    }
    # Never send password hashes to the browser by default
    if include_secret:
        payload["password"] = data.get("password", "")
    return payload


def load_extended_state(conn: sqlite3.Connection) -> dict:
    row = conn.execute(
        "SELECT value FROM settings WHERE key = ?", ("extended_state",)
    ).fetchone()
    if not row:
        return {}
    try:
        data = json.loads(row["value"])
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def save_extended_state(conn: sqlite3.Connection, state: dict, now: str) -> None:
    blob = {k: state.get(k) for k in EXTENDED_STATE_KEYS if k in state}
    # Always keep revision metadata if present
    for k in ("saveRevision", "savedAt", "savedBy"):
        if k in state:
            blob[k] = state[k]
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        ("extended_state", json.dumps(blob)),
    )
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        ("extended_saved_at", json.dumps(now)),
    )


def load_full_state() -> dict:
    with _db_lock:
        conn = get_conn()
        try:
            theme_row = conn.execute(
                "SELECT value FROM settings WHERE key = ?", ("theme",)
            ).fetchone()
            version_row = conn.execute(
                "SELECT value FROM settings WHERE key = ?", ("version",)
            ).fetchone()

            users = [
                public_user(row, include_secret=False)
                for row in conn.execute(
                    "SELECT id, username, password, name, role, active, "
                    "COALESCE(must_change_password, 0) AS must_change_password "
                    "FROM users ORDER BY username"
                )
            ]

            gl_budgets = {
                row["gl_code"]: row["budget"]
                for row in conn.execute("SELECT gl_code, budget FROM gl_budgets")
            }
            for code, amount in DEFAULT_BUDGETS.items():
                gl_budgets.setdefault(code, amount)

            modules = {}
            for row in conn.execute("SELECT module_id, payload FROM modules"):
                try:
                    modules[row["module_id"]] = json.loads(row["payload"])
                except json.JSONDecodeError:
                    modules[row["module_id"]] = {}

            release_cuts = []
            for row in conn.execute(
                "SELECT payload FROM release_cuts ORDER BY processed_at ASC, id ASC"
            ):
                try:
                    release_cuts.append(json.loads(row["payload"]))
                except json.JSONDecodeError:
                    continue

            extended = load_extended_state(conn)
            result = {
                "version": json.loads(version_row["value"]) if version_row else 2,
                "theme": json.loads(theme_row["value"]) if theme_row else "normal",
                "glBudgets": gl_budgets,
                "modules": modules,
                "releaseCuts": release_cuts,
                "users": users,
            }
            result.update(extended)
            return result
        finally:
            conn.close()


def save_full_state(state: dict, *, force: bool = False) -> dict:
    with _db_lock:
        conn = get_conn()
        try:
            now = utc_now()
            conn.execute("BEGIN")

            existing = load_extended_state(conn)
            server_rev = int(existing.get("saveRevision") or 0)
            client_rev = int(state.get("saveRevision") or 0)
            if not force and client_rev > 0 and client_rev < server_rev:
                conn.rollback()
                return {
                    "conflict": True,
                    "serverRevision": server_rev,
                    "clientRevision": client_rev,
                    "savedAt": existing.get("savedAt"),
                    "savedBy": existing.get("savedBy"),
                }

            # Bump revision on every successful save
            next_rev = max(server_rev, client_rev) + 1
            state = {
                **state,
                "saveRevision": next_rev,
                "savedAt": now,
                "savedBy": state.get("savedBy") or "system",
            }

            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                ("theme", json.dumps(state.get("theme", "normal"))),
            )
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                ("version", json.dumps(state.get("version", 2))),
            )

            # Users
            incoming_users = state.get("users") or []
            if incoming_users:
                keep_ids = []
                for user in incoming_users:
                    user_id = user.get("id") or f"u-{uuid.uuid4().hex[:10]}"
                    keep_ids.append(user_id)
                    existing_u = conn.execute(
                        "SELECT password, COALESCE(must_change_password, 0) AS must_change_password "
                        "FROM users WHERE id = ?",
                        (user_id,),
                    ).fetchone()
                    existing_hash = existing_u["password"] if existing_u else None
                    password_value = normalize_password_for_storage(
                        user.get("password"), existing_hash
                    )
                    must_flag = 1 if user.get("mustChangePassword") else 0
                    # Clearing must-change when a new plaintext password was supplied
                    if user.get("password") and not str(user.get("password", "")).startswith("pbkdf2$"):
                        must_flag = 1 if user.get("mustChangePassword") else 0
                    if "mustChangePassword" not in user and existing_u:
                        must_flag = int(existing_u["must_change_password"] or 0)
                    conn.execute(
                        """
                        INSERT INTO users (
                            id, username, password, name, role, active,
                            must_change_password, updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            username = excluded.username,
                            password = excluded.password,
                            name = excluded.name,
                            role = excluded.role,
                            active = excluded.active,
                            must_change_password = excluded.must_change_password,
                            updated_at = excluded.updated_at
                        """,
                        (
                            user_id,
                            user.get("username", ""),
                            password_value,
                            user.get("name", ""),
                            user.get("role", "viewer"),
                            1 if user.get("active", True) else 0,
                            must_flag,
                            now,
                        ),
                    )
                placeholders = ",".join("?" for _ in keep_ids) or "''"
                conn.execute(
                    f"DELETE FROM users WHERE id NOT IN ({placeholders})",
                    keep_ids,
                )

            # Budgets
            budgets = state.get("glBudgets") or {}
            for code, amount in budgets.items():
                conn.execute(
                    """
                    INSERT INTO gl_budgets (gl_code, budget, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(gl_code) DO UPDATE SET
                        budget = excluded.budget,
                        updated_at = excluded.updated_at
                    """,
                    (str(code), float(amount or 0), now),
                )

            # Modules
            modules = state.get("modules") or {}
            keep_modules = []
            for module_id, payload in modules.items():
                keep_modules.append(module_id)
                conn.execute(
                    """
                    INSERT INTO modules (module_id, payload, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(module_id) DO UPDATE SET
                        payload = excluded.payload,
                        updated_at = excluded.updated_at
                    """,
                    (module_id, json.dumps(payload), now),
                )
            if keep_modules:
                placeholders = ",".join("?" for _ in keep_modules)
                conn.execute(
                    f"DELETE FROM modules WHERE module_id NOT IN ({placeholders})",
                    keep_modules,
                )
            else:
                conn.execute("DELETE FROM modules")

            # Release cuts — replace set
            conn.execute("DELETE FROM release_cuts")
            for cut in state.get("releaseCuts") or []:
                cut_id = cut.get("id") or f"rc-{uuid.uuid4().hex[:10]}"
                conn.execute(
                    """
                    INSERT INTO release_cuts (
                        id, transfer_date, from_gl, to_gl, amount,
                        reason, authorized_by, processed_at, payload
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        cut_id,
                        cut.get("date"),
                        cut.get("fromGl") or cut.get("from"),
                        cut.get("toGl") or cut.get("to"),
                        float(cut.get("amount") or 0),
                        cut.get("reason"),
                        cut.get("authorizedBy"),
                        cut.get("processedAt") or now,
                        json.dumps({**cut, "id": cut_id}),
                    ),
                )

            save_extended_state(conn, state, now)

            saved_by = str(state.get("savedBy") or "").strip()
            write_audit(
                conn,
                "data_change",
                f"Application state saved to SQLite (rev {next_rev})",
                username=saved_by or "system",
            )
            conn.commit()
            return {"conflict": False, "saveRevision": next_rev, "savedAt": now}
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def write_audit(
    conn: sqlite3.Connection,
    action: str,
    detail: str = "",
    username: str = "",
) -> None:
    conn.execute(
        "INSERT INTO audit_log (action, detail, username, created_at) VALUES (?, ?, ?, ?)",
        (action, detail or "", username or "", utc_now()),
    )


def append_audit(action: str, detail: str = "", username: str = "") -> None:
    with _db_lock:
        conn = get_conn()
        try:
            write_audit(conn, action, detail, username)
            conn.commit()
        finally:
            conn.close()


def _audit_username(username: str, detail: str) -> str:
    if username:
        return username.strip()
    text = detail or ""
    # client format: user=admin | role=... | ...
    if "user=" in text:
        part = text.split("user=", 1)[1]
        return part.split("|", 1)[0].strip() or ""
    if text.lower().startswith("user "):
        return text.split(" ", 2)[1].strip(" ()") if len(text.split(" ", 2)) > 1 else ""
    return ""


def _format_audit_day(iso_text: str) -> str:
    try:
        dt = datetime.fromisoformat(str(iso_text).replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            dt = dt.astimezone().replace(tzinfo=None)
        return dt.strftime("%A %d %B %Y")
    except Exception:
        return str(iso_text)[:10]


def _format_audit_time(iso_text: str) -> str:
    try:
        dt = datetime.fromisoformat(str(iso_text).replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            dt = dt.astimezone().replace(tzinfo=None)
        return dt.strftime("%H:%M:%S")
    except Exception:
        return str(iso_text)[11:19] if len(str(iso_text)) >= 19 else str(iso_text)


def authenticate(username: str, password: str) -> dict | None:
    with _db_lock:
        conn = get_conn()
        try:
            user_key = resolve_login_username(username)
            pwd = (password or "").strip()
            row = conn.execute(
                """
                SELECT id, username, password, name, role, active,
                       COALESCE(must_change_password, 0) AS must_change_password
                FROM users
                WHERE lower(username) = lower(?)
                """,
                (user_key,),
            ).fetchone()
            if not row:
                return None
            if int(row["active"]) != 1:
                return {"error": "disabled"}
            if not password_accepted_for_user(row["username"], pwd, row["password"]):
                return None

            # Upgrade legacy plaintext passwords to hashes after successful login
            if not str(row["password"]).startswith("pbkdf2$"):
                conn.execute(
                    "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
                    (hash_password(DEFAULT_PLAIN_PASSWORDS.get(row["username"], pwd)), utc_now(), row["id"]),
                )

            # Keep display name current for RP Gate
            if row["username"] == "rp" and row["name"] != "RP Gate":
                conn.execute(
                    "UPDATE users SET name = ?, updated_at = ? WHERE id = ?",
                    ("RP Gate", utc_now(), row["id"]),
                )

            user = public_user(row, include_secret=False)
            if row["username"] == "rp":
                user["name"] = "RP Gate"
            # Forced password renewal is disabled during development
            user["mustChangePassword"] = False

            write_audit(
                conn,
                "login",
                f"User {user['username']} ({user['role']}) signed in",
                username=user["username"],
            )
            conn.commit()
            return user
        finally:
            conn.close()


def db_stats() -> dict:
    with _db_lock:
        conn = get_conn()
        try:
            return {
                "database": DB_PATH.name,
                "path": str(DB_PATH),
                "users": conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"],
                "modules": conn.execute("SELECT COUNT(*) AS c FROM modules").fetchone()["c"],
                "releaseCuts": conn.execute("SELECT COUNT(*) AS c FROM release_cuts").fetchone()["c"],
                "auditEntries": conn.execute("SELECT COUNT(*) AS c FROM audit_log").fetchone()["c"],
            }
        finally:
            conn.close()


def render_db_viewer_html(mode: str = "records") -> bytes:
    mode = (mode or "records").strip().lower()
    if mode not in ("tables", "records", "audit"):
        mode = "records"

    with _db_lock:
        conn = get_conn()
        try:
            tables = [
                r[0]
                for r in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
                )
            ]
            sections = []
            if mode == "audit":
                rows = conn.execute(
                    """
                    SELECT id, action, detail, COALESCE(username, '') AS username, created_at
                    FROM audit_log
                    ORDER BY id ASC
                    """
                ).fetchall()
                events = []
                for row in rows:
                    user = _audit_username(row["username"] or "", row["detail"] or "")
                    events.append(
                        {
                            "id": row["id"],
                            "action": row["action"] or "",
                            "detail": row["detail"] or "",
                            "username": user or "—",
                            "created_at": row["created_at"] or "",
                        }
                    )

                open_logins: dict[str, dict] = {}
                sessions = []
                for ev in events:
                    act = ev["action"].lower()
                    user = ev["username"]
                    if act in ("login", "session_start") and user != "—":
                        open_logins[user] = ev
                    elif act == "logout" and user in open_logins:
                        login_ev = open_logins.pop(user)
                        mid = [
                            e
                            for e in events
                            if e["id"] > login_ev["id"]
                            and e["id"] < ev["id"]
                            and e["username"] == user
                            and e["action"].lower()
                            not in ("login", "session_start", "logout", "server_start")
                        ]
                        changes = "; ".join(
                            f"{e['action']}: {(e['detail'] or '')[:80]}" for e in mid[-12:]
                        ) or "—"
                        sessions.append((login_ev, ev, changes))
                for user, login_ev in open_logins.items():
                    mid = [
                        e
                        for e in events
                        if e["id"] > login_ev["id"]
                        and e["username"] == user
                        and e["action"].lower()
                        not in ("login", "session_start", "logout", "server_start")
                    ]
                    changes = "; ".join(
                        f"{e['action']}: {(e['detail'] or '')[:80]}" for e in mid[-12:]
                    ) or "—"
                    sessions.append((login_ev, None, changes))

                session_rows = []
                for login_ev, logout_ev, changes in reversed(sessions[-200:]):
                    session_rows.append(
                        "<tr>"
                        f"<td>{html_escape(login_ev['username'])}</td>"
                        f"<td>{html_escape(_format_audit_day(login_ev['created_at']))}</td>"
                        f"<td>{html_escape(_format_audit_time(login_ev['created_at']))}</td>"
                        f"<td>{html_escape(_format_audit_time(logout_ev['created_at']) if logout_ev else 'Still signed in')}</td>"
                        f"<td><pre>{html_escape(changes)}</pre></td>"
                        "</tr>"
                    )
                if not session_rows:
                    session_rows.append(
                        '<tr><td colspan="5" class="empty">No login sessions recorded yet</td></tr>'
                    )

                event_rows = []
                for ev in reversed(events[-500:]):
                    event_rows.append(
                        "<tr>"
                        f"<td>{html_escape(_format_audit_day(ev['created_at']))}</td>"
                        f"<td>{html_escape(_format_audit_time(ev['created_at']))}</td>"
                        f"<td>{html_escape(ev['username'])}</td>"
                        f"<td>{html_escape(ev['action'])}</td>"
                        f"<td><pre>{html_escape(ev['detail'])}</pre></td>"
                        "</tr>"
                    )
                if not event_rows:
                    event_rows.append(
                        '<tr><td colspan="5" class="empty">No audit events yet</td></tr>'
                    )

                sections.append(
                    f"""
                    <section class="table-card" id="sessions">
                      <h2>Login / logout sessions <span>({len(sessions)})</span></h2>
                      <p class="hint">Who signed in, day, login time, logout time, and changes during that session.</p>
                      <div class="scroll">
                        <table>
                          <thead><tr>
                            <th>Who</th><th>Day</th><th>Logged in</th><th>Logged out</th><th>Changes made</th>
                          </tr></thead>
                          <tbody>{''.join(session_rows)}</tbody>
                        </table>
                      </div>
                    </section>
                    <section class="table-card" id="events">
                      <h2>Full audit trail <span>({len(events)} events)</span></h2>
                      <div class="scroll">
                        <table>
                          <thead><tr>
                            <th>Day</th><th>Time</th><th>Who</th><th>Action</th><th>Details</th>
                          </tr></thead>
                          <tbody>{''.join(event_rows)}</tbody>
                        </table>
                      </div>
                    </section>
                    """
                )
            elif mode == "tables":
                body_rows = []
                for table in tables:
                    cols = [d[1] for d in conn.execute(f"PRAGMA table_info({table})").fetchall()]
                    count = conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
                    body_rows.append(
                        "<tr>"
                        f"<td><strong>{html_escape(table)}</strong></td>"
                        f"<td>{len(cols)}</td>"
                        f"<td>{html_escape(', '.join(cols))}</td>"
                        f"<td>{count}</td>"
                        f'<td><a href="/db-viewer?mode=records#{html_escape(table)}">Open records</a></td>'
                        "</tr>"
                    )
                if not body_rows:
                    body_rows.append('<tr><td colspan="5" class="empty">No tables</td></tr>')
                sections.append(
                    f"""
                    <section class="table-card" id="tables">
                      <h2>Tables <span>({len(tables)})</span></h2>
                      <div class="scroll">
                        <table>
                          <thead><tr><th>Table</th><th>Columns</th><th>Schema</th><th>Records</th><th></th></tr></thead>
                          <tbody>{''.join(body_rows)}</tbody>
                        </table>
                      </div>
                    </section>
                    """
                )
            else:
                for table in tables:
                    cols = [d[1] for d in conn.execute(f"PRAGMA table_info({table})").fetchall()]
                    rows = conn.execute(f"SELECT * FROM {table}").fetchall()
                    head = "".join(f"<th>{col}</th>" for col in cols)
                    body_rows = []
                    for row in rows:
                        cells = []
                        for col in cols:
                            val = row[col]
                            text = "" if val is None else str(val)
                            if col == "password":
                                text = "••••••••"
                            if col == "payload" and len(text) > 180:
                                text = text[:180] + "…"
                            cells.append(f"<td><pre>{html_escape(text)}</pre></td>")
                        body_rows.append("<tr>" + "".join(cells) + "</tr>")
                    if not body_rows:
                        body_rows.append(
                            f'<tr><td colspan="{max(len(cols), 1)}" class="empty">No rows</td></tr>'
                        )
                    sections.append(
                        f"""
                        <section class="table-card" id="{html_escape(table)}">
                          <h2>{html_escape(table)} <span>({len(rows)} rows)</span></h2>
                          <div class="scroll">
                            <table>
                              <thead><tr>{head}</tr></thead>
                              <tbody>{''.join(body_rows)}</tbody>
                            </table>
                          </div>
                        </section>
                        """
                    )
            stats = {
                "database": DB_PATH.name,
                "path": str(DB_PATH),
                "users": conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"],
                "modules": conn.execute("SELECT COUNT(*) AS c FROM modules").fetchone()["c"],
                "releaseCuts": conn.execute("SELECT COUNT(*) AS c FROM release_cuts").fetchone()["c"],
                "auditEntries": conn.execute("SELECT COUNT(*) AS c FROM audit_log").fetchone()["c"],
            }
        finally:
            conn.close()

    mode_label = {"tables": "Tables", "records": "Records", "audit": "Audit trail"}.get(mode, "Records")
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tech Stores Database Viewer — {mode_label}</title>
  <style>
    :root {{ font-family: Segoe UI, Tahoma, sans-serif; }}
    body {{ margin: 0; background: #f4f6f8; color: #1f2937; }}
    header {{ background: #2c3e50; color: white; padding: 18px 24px; }}
    header h1 {{ margin: 0 0 6px; font-size: 1.35rem; }}
    header p {{ margin: 0; opacity: 0.85; font-size: 0.92rem; }}
    header a {{ color: #93c5fd; }}
    main {{ padding: 20px; max-width: 1200px; margin: 0 auto; }}
    .meta {{ background: white; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }}
    .nav-modes {{ display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }}
    .nav-modes a {{
      display: inline-block; padding: 8px 14px; border-radius: 999px; text-decoration: none;
      background: #e8eef5; color: #1f2937; font-weight: 600; font-size: 0.88rem;
    }}
    .nav-modes a.is-active {{ background: #3498db; color: #fff; }}
    .table-card {{ background: white; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }}
    .table-card h2 {{ margin: 0 0 10px; font-size: 1.05rem; color: #2c3e50; }}
    .table-card h2 span {{ color: #6b7280; font-weight: 500; font-size: 0.9rem; }}
    .hint {{ margin: 0 0 10px; color: #667085; font-size: 0.88rem; }}
    .scroll {{ overflow-x: auto; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.86rem; }}
    th, td {{ border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }}
    th {{ background: #f8fafc; color: #374151; position: sticky; top: 0; }}
    pre {{ margin: 0; white-space: pre-wrap; word-break: break-word; font-family: Consolas, monospace; font-size: 0.8rem; }}
    .empty {{ color: #9ca3af; font-style: italic; }}
  </style>
</head>
<body>
  <header>
    <h1>IT-DIR Tech Stores — Database Viewer ({mode_label})</h1>
    <p>SQLite file: <strong>{html_escape(stats['path'])}</strong> · <a href="/app/">Back to system</a> · <a href="/db-viewer?mode={mode}">Refresh</a></p>
  </header>
  <main>
    <div class="nav-modes">
      <a class="{'is-active' if mode == 'tables' else ''}" href="/db-viewer?mode=tables">Tables</a>
      <a class="{'is-active' if mode == 'records' else ''}" href="/db-viewer?mode=records">Records</a>
      <a class="{'is-active' if mode == 'audit' else ''}" href="/db-viewer?mode=audit">Audit trail</a>
    </div>
    <div class="meta">
      Users: <strong>{stats['users']}</strong> ·
      Modules: <strong>{stats['modules']}</strong> ·
      Release cuts: <strong>{stats['releaseCuts']}</strong> ·
      Audit entries: <strong>{stats['auditEntries']}</strong>
    </div>
    {''.join(sections)}
  </main>
</body>
</html>"""
    return html.encode("utf-8")


def html_escape(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


class TechStoresHandler(BaseHTTPRequestHandler):
    server_version = f"TechStoresServer/{APP_VERSION}"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.address_string()} - {fmt % args}")

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, payload: dict | list) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self) -> None:
        self._send(204, b"", "text/plain")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api/health":
            status = ai_status()
            self._send_json(200, {
                "ok": True,
                "mode": "online",
                "database": True,
                "stats": db_stats(),
                "ai": status,
            })
            return

        if path == "/api/mode":
            self._send_json(200, mode_status_payload("online"))
            return

        if path == "/api/ai/status":
            self._send_json(200, ai_status())
            return

        if path == "/api/exchange-rate":
            qs = parse_qs(parsed.query or "")
            force = (qs.get("force") or ["0"])[0] in ("1", "true", "yes")
            try:
                result = fetch_rbz_usd_zig_rate(force=force)
                self._send_json(200, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": f"Exchange rate lookup failed: {exc}"})
            return

        if path == "/api/state":
            self._send_json(200, {"ok": True, "appState": load_full_state(), "stats": db_stats()})
            return

        if path in ("/db-viewer", "/database", "/view-db"):
            qs = parse_qs(parsed.query or "")
            mode = (qs.get("mode") or ["records"])[0]
            self._send(200, render_db_viewer_html(mode), "text/html; charset=utf-8")
            return

        if path in ("/", "/index.html"):
            # Prefer modular app entrypoint
            redirect = b'<meta http-equiv="refresh" content="0;url=/app/">'
            self.send_response(302)
            self.send_header("Location", "/app/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        if path in ("/app", "/app/"):
            path = f"/{APP_INDEX}"

        # Static files
        rel = path.lstrip("/").replace("\\", "/")
        if ".." in rel.split("/"):
            self._send_json(400, {"ok": False, "error": "Invalid path"})
            return

        file_path = (ROOT / rel).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.is_file():
            self._send_json(404, {"ok": False, "error": "Not found"})
            return

        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        if file_path.suffix.lower() == ".html":
            content_type = "text/html; charset=utf-8"
        elif file_path.suffix.lower() == ".js":
            content_type = "application/javascript; charset=utf-8"
        elif file_path.suffix.lower() == ".css":
            content_type = "text/css; charset=utf-8"
        data = file_path.read_bytes()
        self._send(200, data, content_type)

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path != "/api/state":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return
        try:
            payload = self._read_json()
            state = payload.get("appState") or payload
            if not isinstance(state, dict):
                raise ValueError("Invalid state payload")
            force = bool(payload.get("force"))
            result = save_full_state(state, force=force)
            if result.get("conflict"):
                self._send_json(
                    409,
                    {
                        "ok": False,
                        "error": "Save conflict — newer revision exists on server.",
                        "serverRevision": result.get("serverRevision"),
                        "clientRevision": result.get("clientRevision"),
                        "savedAt": result.get("savedAt"),
                        "savedBy": result.get("savedBy"),
                    },
                )
                return
            self._send_json(
                200,
                {
                    "ok": True,
                    "savedAt": result.get("savedAt") or utc_now(),
                    "saveRevision": result.get("saveRevision"),
                    "stats": db_stats(),
                },
            )
        except Exception as exc:
            self._send_json(400, {"ok": False, "error": str(exc)})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api/mode/switch":
            handle_mode_switch(self, "online", self._read_json)
            return

        if path == "/api/login":
            try:
                payload = self._read_json()
                username = str(payload.get("username", ""))
                password = str(payload.get("password", ""))
                result = authenticate(username, password)
                if result is None:
                    try:
                        append_audit(
                            "login_failed",
                            f"Failed login attempt for “{username.strip()}”",
                            username=resolve_login_username(username.strip()) if username.strip() else "",
                        )
                    except Exception:
                        pass
                    self._send_json(401, {"ok": False, "error": "Invalid username or password."})
                    return
                if result.get("error") == "disabled":
                    self._send_json(
                        403,
                        {"ok": False, "error": "This account is disabled. Contact an administrator."},
                    )
                    return
                self._send_json(200, {"ok": True, "user": result})
            except Exception as exc:
                self._send_json(400, {"ok": False, "error": str(exc)})
            return

        if path == "/api/audit":
            try:
                payload = self._read_json()
                action = str(payload.get("action") or "client_event").strip()[:120] or "client_event"
                detail = str(payload.get("detail") or "")[:2000]
                username = str(payload.get("username") or "")[:80]
                if not username:
                    username = _audit_username("", detail)
                append_audit(action, detail, username)
                self._send_json(200, {"ok": True})
            except Exception as exc:
                self._send_json(400, {"ok": False, "error": str(exc)})
            return

        if path in ("/api/product-specs", "/api/product-enrich"):
            try:
                payload = self._read_json()
                query = str(payload.get("query") or payload.get("itemName") or "").strip()
                force = bool(payload.get("force"))
                result = lookup_product_specs(query, force=force)
                status = 200 if result.get("ok") else 404
                if result.get("error") and "Enter a product" in str(result.get("error")):
                    status = 400
                self._send_json(status, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": f"Product lookup failed: {exc}"})
            return

        if path == "/api/market-catalog":
            try:
                payload = self._read_json()
                query = str(
                    payload.get("query")
                    or payload.get("keywords")
                    or payload.get("brand")
                    or ""
                ).strip()
                category = str(payload.get("category") or "laptop").strip().lower()
                force = bool(payload.get("force"))
                result = lookup_market_catalog(query, category=category, force=force)
                status = 200 if result.get("ok") else 404
                if result.get("error") and "Enter a brand or keywords" in str(result.get("error")):
                    status = 400
                self._send_json(status, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": f"Market catalog lookup failed: {exc}"})
            return

        if path == "/api/ai/spec-document":
            try:
                payload = self._read_json()
                result = parse_spec_document(
                    text=str(payload.get("text") or ""),
                    image_base64=str(payload.get("imageBase64") or payload.get("image") or ""),
                    mime_type=str(payload.get("mimeType") or "image/jpeg"),
                    category_hint=str(payload.get("category") or payload.get("categoryHint") or ""),
                    product_hint=str(payload.get("productHint") or payload.get("productName") or ""),
                )
                status = 200 if result.get("ok") else 400
                self._send_json(status, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": f"Spec document parse failed: {exc}"})
            return

        if path == "/api/ai/ask":
            try:
                payload = self._read_json()
                question = str(payload.get("question") or "").strip()
                context = payload.get("context") if isinstance(payload.get("context"), dict) else {}
                result = answer_stores_question(question, context)
                status = 200 if result.get("ok") else 400
                self._send_json(status, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": f"AI assistant failed: {exc}"})
            return

        if path == "/api/ai/draft-justification":
            try:
                payload = self._read_json()
                result = draft_requisition_justification(payload)
                status = 200 if result.get("ok") else 400
                self._send_json(status, result)
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": f"Draft failed: {exc}"})
            return

        self._send_json(404, {"ok": False, "error": "Not found"})


def _lan_urls(port: int) -> list[str]:
    """Best-effort LAN URLs for phones on the same Wi-Fi."""
    urls: list[str] = []
    try:
        import socket
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127."):
                urls.append(f"http://{ip}:{port}/app/")
    except Exception:
        pass
    # de-dupe preserve order
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _load_dotenv() -> None:
    """Load ROOT/.env into os.environ (simple KEY=VALUE, no quotes required)."""
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return
    import os
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def main() -> None:
    _load_dotenv()
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    if not (ROOT / "app" / "index.html").is_file():
        print("=" * 60)
        print(" ERROR: app folder missing next to this program.")
        print(f" Expected: {ROOT / 'app' / 'index.html'}")
        print(" Re-copy the full TECHSTORES-Portable folder.")
        print("=" * 60)
        input("Press Enter to close…")
        sys.exit(1)

    # Ensure .webmanifest is served with the correct type for PWA install
    mimetypes.add_type("application/manifest+json", ".webmanifest")

    init_db()
    prepare_server_startup("online")
    server = ThreadingHTTPServer((HOST, PORT), TechStoresHandler)
    local_url = f"http://127.0.0.1:{PORT}/app/"
    lan = _lan_urls(PORT)
    print("=" * 60)
    print(f" {APP_NAME} — Database Server")
    print(f" Version: {APP_VERSION}")
    print("=" * 60)
    print(f" App (this PC):  {local_url}")
    if lan:
        print(" Phone (same Wi-Fi) — open in Chrome/Safari:")
        for u in lan:
            print(f"   {u}")
        print(" Then: browser menu → Add to Home screen / Install app")
    else:
        print(" Phone: connect to this PC's Wi-Fi IP, port 8080 /app/")
    print(f" Database: {DB_PATH}")
    print("           (persistent on disk — survives logout & PC shutdown)")
    print(f" DB View:  http://127.0.0.1:{PORT}/db-viewer")
    print(f" API:      http://127.0.0.1:{PORT}/api/health")
    ai = ai_status()
    print(f" AI:       {'enabled (' + str(ai.get('model') or 'model') + ')' if ai.get('aiEnabled') else 'off — copy .env.example to .env and set OPENAI_API_KEY'}")
    print(" Keep this window open while using the system.")
    print(" Press Ctrl+C to stop")
    print("=" * 60)
    print("TECHSTORES_READY", flush=True)

    def _open_browser() -> None:
        if os.environ.get("TECHSTORES_NO_BROWSER"):
            return
        try:
            webbrowser.open(local_url)
        except Exception:
            pass

    threading.Timer(0.8, _open_browser).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
