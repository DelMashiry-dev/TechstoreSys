"""
Product specification lookup: web search + intelligent extraction.
Used by POST /api/product-specs
"""

from __future__ import annotations

import json
import os
import re
import ssl
import threading
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from typing import Any

USER_AGENT = (
    "Mozilla/5.0 (compatible; TechStoresSpecLookup/1.0; "
    "+https://localhost; IT-DIR internal procurement aide)"
)
REQUEST_TIMEOUT = 12
CACHE_TTL_SECONDS = 14 * 24 * 3600
CACHE_PATH = Path(__file__).resolve().parent / "data" / "product-web-cache.json"
RBZ_RATE_PATH = Path(__file__).resolve().parent / "data" / "rbz-exchange-rate.json"
RBZ_RATE_URL = "https://www.rbz.co.zw/index.php/research/markets/exchange-rates"
RBZ_RATE_TTL_SECONDS = 12 * 3600
_cache_lock = threading.Lock()

PDF_HREF_RE = re.compile(
    r"""https?://[^\s"'<>]+?(?:\.pdf(?:\?[^\s"'<>]*)?|/GetPDF\.aspx/[^\s"'<>]+)""",
    re.I,
)
DATASHEET_HOST_HINTS = (
    "hp.com",
    "hpe.com",
    "dell.com",
    "cisco.com",
    "lenovo.com",
    "canon.com",
    "brother.com",
    "epson.com",
    "samsung.com",
    "apple.com",
    "microsoft.com",
    "aruba",
    "fortinet",
    "xerox.com",
    "kyocera",
    "psnow",
    "i.dell.com",
    "www8.hp.com",
)

SPEC_LABEL_PATTERNS = [
    ("Processor", re.compile(r"(?:processor|cpu|chipset)\s*[:\-–]\s*([^\n|;]{3,90})", re.I)),
    ("Memory (RAM)", re.compile(r"(?:memory\s*\(ram\)|memory|ram)\s*[:\-–]\s*([^\n|;]{2,60})", re.I)),
    ("Memory Channels", re.compile(r"(?:memory\s*channels?|dimm\s*channels?)\s*[:\-–]\s*([^\n|;]{2,60})", re.I)),
    ("Boot Storage", re.compile(r"(?:boot\s*(?:storage|drive|volume)|os\s*drive)\s*[:\-–]\s*([^\n|;]{2,80})", re.I)),
    ("Internal Storage", re.compile(r"(?:internal\s*storage|storage\s*bays?|drive\s*bays?)\s*[:\-–]\s*([^\n|;]{2,90})", re.I)),
    ("Storage", re.compile(r"(?:storage|ssd|hdd|internal\s+memory)\s*[:\-–]\s*([^\n|;]{2,80})", re.I)),
    ("Expansion Slots", re.compile(r"(?:expansion\s*slots?|pcie)\s*[:\-–]\s*([^\n|;]{2,80})", re.I)),
    ("RAID / Storage Controller", re.compile(r"(?:raid|storage\s*controller|smart\s*array|perc)\s*[:\-–]\s*([^\n|;]{2,80})", re.I)),
    ("Remote Management", re.compile(r"(?:remote\s*management|management|ilo|idrac|ipmi)\s*[:\-–]\s*([^\n|;]{2,60})", re.I)),
    ("Form Factor", re.compile(r"(?:form\s*factor|rack\s*mount)\s*[:\-–]\s*([^\n|;]{2,40})", re.I)),
    ("Power Supply", re.compile(r"(?:power(?:\s*supply)?|psu|redundant\s*psu)\s*[:\-–]\s*([^\n|;]{2,60})", re.I)),
    ("Display", re.compile(r"(?:display|screen|panel)\s*[:\-–]\s*([^\n|;]{3,90})", re.I)),
    ("Operating System", re.compile(r"(?:operating\s+system|\bos\b)\s*[:\-–]\s*([^\n|;]{2,60})", re.I)),
    ("Battery", re.compile(r"(?:battery)\s*[:\-–]\s*([^\n|;]{2,70})", re.I)),
    ("Graphics / GPUs", re.compile(r"(?:graphics|gpu|gpus)\s*[:\-–]\s*([^\n|;]{3,80})", re.I)),
    ("Network", re.compile(r"(?:network|nic|ethernet)\s*[:\-–]\s*([^\n|;]{3,80})", re.I)),
    ("Connectivity", re.compile(r"(?:connectivity|wireless|wi-?fi)\s*[:\-–]\s*([^\n|;]{3,100})", re.I)),
    ("Weight", re.compile(r"(?:weight)\s*[:\-–]\s*([^\n|;]{2,40})", re.I)),
    ("Dimensions", re.compile(r"(?:dimensions|size)\s*[:\-–]\s*([^\n|;]{3,80})", re.I)),
    ("Warranty", re.compile(r"(?:warranty)\s*[:\-–]\s*([^\n|;]{2,60})", re.I)),
]

INLINE_PATTERNS = [
    ("Processor", re.compile(
        r"\b((?:\d+(?:st|nd|rd|th|5th)\s+Gen\s+)?Intel\s+Xeon(?:\s+Scalable)?(?:\s+[\w-]{2,24})?|"
        r"AMD\s+EPYC(?:\s+[\w-]{2,24})?|"
        r"Intel\s+Core\s+(?:Ultra\s+)?i?[3579]\w*(?:\s*[-/]?\s*\d{4,5}\w*)?|"
        r"AMD\s+Ryzen(?:\s+AI)?\s*[3579]\w*|Apple\s+[AM]\d(?:\s+(?:Pro|Max|Ultra))?|"
        r"Snapdragon\s+[\w\s]{2,30}|Exynos\s+\d+|MediaTek\s+[\w\s-]{2,24})\b",
        re.I,
    )),
    ("Memory (RAM)", re.compile(r"\b(\d+(?:\.\d+)?\s*(?:TB|GB)(?:\s*DDR\d)?(?:\s*ECC)?(?:\s*RAM|\s*Memory)?)\b", re.I)),
    ("Memory Channels", re.compile(r"\b(\d+\s*(?:DIMM\s*)?(?:memory\s*)?channels?(?:\s*per\s*processor)?)\b", re.I)),
    ("Boot Storage", re.compile(r"\b(RAID\s*M\.?2(?:\s+boot)?(?:\s+options)?|BOSS[\w-]*|NVMe\s+boot)\b", re.I)),
    ("Internal Storage", re.compile(r"\b(\d+\s*(?:EDSFF|SFF|LFF|hot[-\s]?plug\s*)?(?:drive\s*)?bays?)\b", re.I)),
    ("Expansion Slots", re.compile(r"\b(PCIe\s*Gen\s*\d+)\b", re.I)),
    ("Graphics / GPUs", re.compile(r"\b(\d+\s*(?:single[-\s]?wide\s*)?GPUs?)\b", re.I)),
    ("Storage", re.compile(
        r"\b(\d+\s*(?:GB|TB)(?:\s*/\s*\d+\s*(?:GB|TB))?(?:\s*(?:NVMe\s*)?(?:SSD|HDD|UFS))?)\b",
        re.I,
    )),
    ("Display", re.compile(
        r"\b(\d{1,2}(?:\.\d)?\s*(?:\"|''|inch|in)"
        r"(?:\s*(?:Dynamic\s+)?AMOLED|OLED|LCD|IPS|TFT|Liquid\s+Retina)?"
        r"(?:\s*\([^)]{0,40}\))?)\b",
        re.I,
    )),
    ("Operating System", re.compile(
        r"\b(Windows\s*Server\s*20(?:19|22)(?:\s+and\s+licen[cs]e\s+key)?|Windows\s*Server|"
        r"Windows\s*1[01](?:\s*Pro)?|Android(?:\s*\d+)?(?:\s*\([^)]*\))?|"
        r"iPadOS(?:\s*\d+)?|macOS(?:\s+\w+)?|ChromeOS|RHEL|Ubuntu\s*Server)\b",
        re.I,
    )),
]

CATEGORY_RULES = [
    ("other", re.compile(r"\b(tablet|ipad|galaxy\s*tab|\btab\s*[as]?\d+|galaxy\s*tab)\b", re.I)),
    ("laptop", re.compile(r"\b(laptop|notebook|elitebook|probook|thinkpad|macbook|latitude|xps)\b", re.I)),
    ("desktop", re.compile(r"\b(desktop|optiplex|thinkcentre|imac|tower)\b", re.I)),
    ("printer", re.compile(r"\b(printer|laserjet|mfp|imageclass|ecosys)\b", re.I)),
    ("server", re.compile(r"\b(server|proliant|poweredge|xeon|epyc|rack|dl380|dl360|thinksystem)\b", re.I)),
    ("network", re.compile(r"\b(switch|router|firewall|access\s*point|wireless\s*controller|catalyst)\b", re.I)),
]

BRAND_HINTS = [
    "Samsung", "Apple", "HP", "Hewlett Packard", "HPE", "Dell", "Lenovo", "ASUS", "Acer",
    "Microsoft", "Canon", "Epson", "Brother", "Cisco", "Huawei", "Xerox", "Kyocera", "Ricoh",
    "Alienware", "MSI", "Razer",
]

USE_CASE_SEARCH_HINTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b(gaming|gamer|esports|game)\b", re.I), "gaming laptop RTX GPU high refresh OMEN Legion Alienware"),
    (re.compile(r"\b(architecture|architect|cad|autocad|revit|bim|sketchup|3d\s*render)\b", re.I),
     "architecture workstation CAD RTX 32GB RAM Precision ZBook mobile workstation"),
    (re.compile(r"\b(video\s*edit|creative|photoshop|premiere|content\s*creat)\b", re.I),
     "creative laptop workstation OLED RTX 32GB RAM MacBook Pro"),
    (re.compile(r"\b(business|office|corporate|enterprise)\b", re.I),
     "business laptop EliteBook ThinkPad Latitude ProBook durable"),
    (re.compile(r"\b(student|school|education|university|college)\b", re.I),
     "student laptop affordable lightweight battery life"),
    (re.compile(r"\b(server|datacenter|virtualization)\b", re.I),
     "server rack Xeon EPYC ProLiant PowerEdge"),
]


def http_get(url: str, timeout: int = REQUEST_TIMEOUT) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/json,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.8",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="ignore")


def http_post(url: str, form: dict[str, str], timeout: int = REQUEST_TIMEOUT) -> str:
    body = urllib.parse.urlencode(form).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.8",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="ignore")


def duckduckgo_lite_search(query: str) -> str:
    """DDG Lite requires POST; GET often returns the landing page without results."""
    return http_post("https://lite.duckduckgo.com/lite/", {"q": query})


def strip_html(html: str) -> str:
    text = re.sub(r"(?is)<(script|style|noscript|svg).*?>.*?</\1>", " ", html)
    text = re.sub(r"(?is)<!--.*?-->", " ", text)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n", text)
    text = re.sub(r"(?i)</tr>", "\n", text)
    text = re.sub(r"(?i)</(li|h[1-6]|div)>", "\n", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def detect_category(text: str, query: str = "") -> str:
    # Prefer signals from the user's product name over noisy web snippets
    for source in (query, text):
        if not source:
            continue
        for category, pattern in CATEGORY_RULES:
            if pattern.search(source):
                return category
    return "other"


def detect_brand(text: str) -> str:
    for brand in sorted(BRAND_HINTS, key=len, reverse=True):
        if re.search(rf"\b{re.escape(brand)}\b", text, re.I):
            if brand.lower() == "hewlett packard":
                return "HP"
            return brand
    return ""


def clean_value(value: str) -> str:
    value = re.sub(r"\s+", " ", value or "").strip(" -:;,.|")
    if len(value) > 120:
        value = value[:117].rstrip() + "..."
    return value


def extract_specs_from_text(text: str) -> list[list[str]]:
    found: dict[str, str] = {}

    for label, pattern in SPEC_LABEL_PATTERNS:
        match = pattern.search(text)
        if match:
            found[label] = clean_value(match.group(1))

    for label, pattern in INLINE_PATTERNS:
        if label in found:
            continue
        match = pattern.search(text)
        if match:
            found[label] = clean_value(match.group(1))

    if "RAM" not in found:
        m = re.search(r"\b(\d+)\s*GB\s*(?:RAM|memory)\b", text, re.I)
        if m:
            found["RAM"] = f"{m.group(1)} GB RAM"
    if "Storage" not in found:
        m = re.search(r"\b(\d+)\s*(GB|TB)\s*(NVMe\s*)?(SSD|HDD|UFS)\b", text, re.I)
        if m:
            found["Storage"] = clean_value(m.group(0))

    specs: list[list[str]] = []
    for label, value in found.items():
        if value:
            specs.append([label, value, "Extracted from online product information"])
    return specs


def wikipedia_lookup(query: str) -> dict[str, Any] | None:
    search_url = (
        "https://en.wikipedia.org/w/api.php?"
        + urllib.parse.urlencode(
            {
                "action": "opensearch",
                "search": query,
                "limit": "3",
                "namespace": "0",
                "format": "json",
            }
        )
    )
    try:
        data = json.loads(http_get(search_url))
    except Exception:
        return None

    titles = data[1] if isinstance(data, list) and len(data) > 1 else []
    urls = data[3] if isinstance(data, list) and len(data) > 3 else []
    if not titles:
        return None

    title = titles[0]
    summary_url = (
        "https://en.wikipedia.org/api/rest_v1/page/summary/"
        + urllib.parse.quote(title.replace(" ", "_"))
    )
    extract = ""
    page_url = urls[0] if urls else ""
    image_url = ""
    try:
        summary = json.loads(http_get(summary_url))
        extract = summary.get("extract") or ""
        page_url = summary.get("content_urls", {}).get("desktop", {}).get("page") or page_url
        original = summary.get("originalimage") or {}
        thumb = summary.get("thumbnail") or {}
        image_url = original.get("source") or thumb.get("source") or ""
    except Exception:
        pass

    page_text = extract
    if page_url and (not extract or len(extract) < 280):
        try:
            html = http_get(page_url)
            page_text = f"{extract}\n{strip_html(html)[:12000]}"
        except Exception:
            pass

    return {
        "title": title,
        "url": page_url,
        "text": page_text,
        "extract": extract,
        "image": image_url,
        "provider": "wikipedia",
    }


def duckduckgo_lookup(query: str) -> dict[str, Any] | None:
    api_url = "https://api.duckduckgo.com/?" + urllib.parse.urlencode(
        {"q": f"{query} specifications", "format": "json", "no_html": "1", "skip_disambig": "1"}
    )
    abstract = ""
    related = ""
    url = ""
    data: dict[str, Any] = {}
    try:
        data = json.loads(http_get(api_url))
        abstract = data.get("AbstractText") or ""
        url = data.get("AbstractURL") or ""
        related_bits = []
        for topic in data.get("RelatedTopics") or []:
            if isinstance(topic, dict) and topic.get("Text"):
                related_bits.append(topic["Text"])
            elif isinstance(topic, dict) and isinstance(topic.get("Topics"), list):
                for sub in topic["Topics"][:3]:
                    if isinstance(sub, dict) and sub.get("Text"):
                        related_bits.append(sub["Text"])
        related = "\n".join(related_bits[:8])
    except Exception:
        pass

    lite_text = ""
    try:
        lite_html = duckduckgo_lite_search(f"{query} specs processor ram storage display")
        lite_text = strip_html(lite_html)[:10000]
    except Exception:
        pass

    combined = "\n".join(part for part in [abstract, related, lite_text] if part).strip()
    image = ""
    try:
        image = (data.get("Image") if isinstance(data, dict) else "") or ""
        if image.startswith("/"):
            image = "https://duckduckgo.com" + image
    except Exception:
        image = ""
    if not combined and not image:
        return None

    return {
        "title": query,
        "url": url or "https://duckduckgo.com/?" + urllib.parse.urlencode({"q": query}),
        "text": combined,
        "image": image,
        "provider": "duckduckgo",
    }


def openai_enrich(query: str, source_text: str) -> list[list[str]] | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    prompt = {
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "Extract procurement-ready ICT product specifications as JSON with keys: "
                    "brand, model, category (laptop|desktop|printer|server|network|other), "
                    "specs (array of {name, value, note}). Use only facts supported by the text. "
                    "If unknown, omit the field. Keep values concise. "
                    "For servers use fields such as: Operating System, Processor, Memory (RAM), "
                    "Memory Channels, Boot Storage, Internal Storage, RAID / Storage Controller, "
                    "Expansion Slots, Graphics / GPUs, Network, Power Supply, Form Factor, "
                    "Remote Management, Warranty."
                ),
            },
            {
                "role": "user",
                "content": f"Product query: {query}\n\nSource text:\n{source_text[:9000]}",
            },
        ],
    }
    body = json.dumps(prompt).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25, context=ssl.create_default_context()) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except Exception:
        return None

    specs_out: list[list[str]] = []
    for row in parsed.get("specs") or []:
        if not isinstance(row, dict):
            continue
        name = clean_value(str(row.get("name") or ""))
        value = clean_value(str(row.get("value") or ""))
        note = clean_value(str(row.get("note") or "AI-extracted from online sources"))
        if name and value:
            specs_out.append([name, value, note or "AI-extracted from online sources"])
    return specs_out or None


def merge_specs(*groups: list[list[str]]) -> list[list[str]]:
    merged: dict[str, list[str]] = {}
    for group in groups:
        for row in group or []:
            if len(row) < 2:
                continue
            name, value = clean_value(row[0]), clean_value(row[1])
            if not name or not value:
                continue
            key = name.lower()
            if key not in merged:
                note = clean_value(row[2]) if len(row) > 2 else "From online lookup"
                merged[key] = [name, value, note]
    return list(merged.values())


def cache_key(query: str) -> str:
    return re.sub(r"\s+", " ", (query or "").strip().lower())


def _load_cache_file() -> dict[str, Any]:
    if not CACHE_PATH.is_file():
        return {}
    try:
        data = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def read_cached_enrich(query: str) -> dict[str, Any] | None:
    key = cache_key(query)
    if not key:
        return None
    with _cache_lock:
        blob = _load_cache_file().get(key)
    if not isinstance(blob, dict):
        return None
    ts = float(blob.get("cachedAt") or 0)
    if ts and (time.time() - ts) > CACHE_TTL_SECONDS:
        return None
    result = blob.get("result")
    return result if isinstance(result, dict) else None


def _sanitize_cache_payload(value: Any) -> Any:
    if isinstance(value, str):
        return value.encode("utf-8", errors="replace").decode("utf-8")
    if isinstance(value, list):
        return [_sanitize_cache_payload(v) for v in value]
    if isinstance(value, dict):
        return {k: _sanitize_cache_payload(v) for k, v in value.items()}
    return value


def write_cached_enrich(query: str, result: dict[str, Any]) -> None:
    key = cache_key(query)
    if not key or not result.get("ok"):
        return
    with _cache_lock:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        data = _load_cache_file()
        data[key] = {"cachedAt": time.time(), "result": _sanitize_cache_payload(result)}
        # Keep cache bounded
        if len(data) > 400:
            oldest = sorted(data.items(), key=lambda kv: float((kv[1] or {}).get("cachedAt") or 0))
            for drop_key, _ in oldest[: len(data) - 400]:
                data.pop(drop_key, None)
        CACHE_PATH.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def commons_image_lookup(query: str) -> str:
    url = (
        "https://commons.wikimedia.org/w/api.php?"
        + urllib.parse.urlencode(
            {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": query,
                "gsrnamespace": "6",
                "gsrlimit": "6",
                "prop": "imageinfo",
                "iiprop": "url|mime|size",
                "iiurlwidth": "720",
            }
        )
    )
    try:
        data = json.loads(http_get(url))
    except Exception:
        return ""
    pages = (data.get("query") or {}).get("pages") or {}
    best = ""
    best_score = 12
    qbits, distinctive = _image_query_bits(query)
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        mime = str(info.get("mime") or "").lower()
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        candidate = info.get("thumburl") or info.get("url") or ""
        if not candidate:
            continue
        title = str(page.get("title") or "").lower()
        if "logo" in title or "icon" in title or "screenshot" in title or "wikimedia foundation" in title:
            continue
        if not _image_title_matches(query, title, candidate):
            continue
        score = 10
        for bit in qbits:
            if bit in title or bit in candidate.lower():
                score += 8
        if score > best_score:
            best_score = score
            best = candidate
    return best


_IMAGE_SKIP_RE = re.compile(
    r"logo|sprite|icon|favicon|pixel|tracking|1x1|spacer|blank\.gif|placeholder|avatar",
    re.I,
)
_IMAGE_QUERY_STOP = {
    "the", "and", "for", "with", "gen", "intel", "amd", "laptop", "server",
    "notebook", "computer", "system", "series", "from", "best", "new",
}


def _image_query_bits(query: str) -> tuple[set[str], set[str]]:
    bits = {
        b for b in re.findall(r"[a-z0-9]{3,}", (query or "").lower())
        if b not in _IMAGE_QUERY_STOP
    }
    distinctive = {b for b in bits if re.search(r"\d", b) or len(b) >= 7}
    return bits, distinctive


def _image_title_matches(query: str, title: str, extra: str = "") -> bool:
    blob = f"{title} {extra}".lower()
    bits, distinctive = _image_query_bits(query)
    if not bits:
        return False
    model_bits = {b for b in bits if re.search(r"\d", b)}
    if model_bits and not any(bit in blob for bit in model_bits):
        return False
    if distinctive and not any(bit in blob for bit in distinctive):
        return False
    overlap = sum(1 for bit in bits if bit in blob)
    if distinctive:
        return overlap >= 1
    ict_hint = re.search(
        r"laptop|notebook|thinkpad|macbook|computer|processor|workstation|"
        r"intel|amd|hp|dell|lenovo|asus|server|rack",
        blob,
    )
    return overlap >= 2 and bool(ict_hint)


def is_public_http_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url or "")
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host or host in ("localhost", "127.0.0.1", "::1") or host.endswith(".local"):
        return False
    if host.startswith("10.") or host.startswith("192.168.") or host.startswith("169.254."):
        return False
    return True


def is_usable_product_image(url: str) -> bool:
    u = unescape((url or "").strip())
    if not u.startswith("http://") and not u.startswith("https://"):
        return False
    if _IMAGE_SKIP_RE.search(u):
        return False
    return True


def wikipedia_thumb_lookup(query: str) -> str:
    q = re.sub(r"\s+", " ", (query or "").strip())
    if len(q) < 4:
        return ""
    url = (
        "https://en.wikipedia.org/w/api.php?"
        + urllib.parse.urlencode(
            {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": q,
                "gsrlimit": "4",
                "prop": "pageimages",
                "pithumbsize": "720",
                "pilicense": "any",
            }
        )
    )
    try:
        data = json.loads(http_get(url, timeout=8))
    except Exception:
        return ""
    pages = (data.get("query") or {}).get("pages") or {}
    qbits, _distinctive = _image_query_bits(q)
    best = ""
    best_score = 40
    for page in pages.values():
        thumb = page.get("thumbnail") or {}
        src = str(thumb.get("source") or "")
        if not src:
            continue
        title = str(page.get("title") or "").lower()
        if re.search(r"screenshot|disambiguation|logo|icon|windows|openvms|desktop environment|wikimedia foundation", title):
            continue
        if re.search(r"wikimedia_foundation|foundation_servers", src, re.I):
            continue
        if not _image_title_matches(q, title, src):
            continue
        overlap = sum(1 for bit in qbits if bit in title)
        if overlap < 1:
            continue
        score = int(thumb.get("width") or 0) + overlap * 40
        if score > best_score:
            best_score = score
            best = src
    return best


def extract_html_image(html: str, base_url: str) -> str:
    blob = html or ""
    patterns = (
        r'<meta[^>]+property=["\']og:image(?::url)?["\'][^>]+content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::url)?["\']',
        r'<meta[^>]+name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)',
        r'"image"\s*:\s*\[\s*"(https?://[^"]+)"',
        r'"image"\s*:\s*"(https?://[^"]+)"',
    )
    for pattern in patterns:
        match = re.search(pattern, blob, re.I)
        if not match:
            continue
        url = resolve_catalog_url(unescape(match.group(1)), base_url)
        if is_usable_product_image(url):
            return url
    return ""


def product_image_lookup(title: str, page_url: str = "") -> str:
    title = re.sub(r"\s+", " ", (title or "").strip())
    if not title and not page_url:
        return ""
    cache_q = f"img7::{(title or page_url)[:90]}"
    cached = read_cached_enrich(cache_q)
    if cached and cached.get("imageUrl"):
        return str(cached["imageUrl"])
    junk_title = is_store_landing_listing(title, page_url) or is_benchmark_or_review_listing(
        title, "", page_url, "laptop"
    )
    img = ""
    if page_url and not is_store_landing_listing(title, page_url):
        img = listing_page_image(page_url)
    if not img and title and not junk_title:
        img = wikipedia_thumb_lookup(title)
    if not img and title and not junk_title:
        img = commons_image_lookup(title)
    if not img and title and not junk_title:
        family_parts = [
            tok for tok in re.findall(r"[A-Za-z][A-Za-z\-]{2,}", title)
            if tok.lower() not in _IMAGE_QUERY_STOP
        ][:3]
        family = " ".join(family_parts)
        if family and len(family) >= 8:
            img = commons_image_lookup(family) or wikipedia_thumb_lookup(family)
    if img:
        write_cached_enrich(cache_q, {"ok": True, "imageUrl": img})
    return img


def listing_page_image(page_url: str) -> str:
    if not is_public_http_url(page_url):
        return ""
    try:
        html = http_get(page_url, timeout=7)
    except Exception:
        return ""
    return extract_html_image(html, page_url)


def fill_product_images(items: list[dict[str, Any]], limit: int = 12) -> None:
    jobs = [row for row in items if isinstance(row, dict) and not row.get("imageUrl")][:limit]
    if not jobs:
        return

    def _one(row: dict[str, Any]) -> tuple[dict[str, Any], str]:
        return row, product_image_lookup(str(row.get("title") or ""), str(row.get("url") or ""))

    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(_one, row) for row in jobs]
        for fut in as_completed(futs):
            try:
                row, img = fut.result()
            except Exception:
                continue
            if img:
                row["imageUrl"] = img


def lookup_product_images(requests: list[Any]) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    for req in (requests or [])[:12]:
        if not isinstance(req, dict):
            continue
        title = str(req.get("title") or "").strip()
        ident = str(req.get("id") or title)
        if not ident:
            continue
        items.append({
            "id": ident,
            "title": title,
            "url": str(req.get("url") or ""),
            "imageUrl": str(req.get("imageUrl") or ""),
        })
    fill_product_images(items, limit=12)
    images = {
        row["id"]: row["imageUrl"]
        for row in items
        if row.get("id") and row.get("imageUrl")
    }
    return {"ok": True, "images": images, "count": len(images)}


def score_datasheet_url(url: str, query: str) -> int:
    u = (url or "").lower()
    if not u:
        return -999
    score = 0
    if ".pdf" in u or "getpdf.aspx" in u or "psnow" in u or "spec-sheet" in u or "datasheet" in u:
        score += 40
    for host in DATASHEET_HOST_HINTS:
        if host in u:
            score += 30
            break
    for bit in re.findall(r"[a-z0-9]{3,}", query.lower()):
        if bit in u:
            score += 6
    if any(bad in u for bad in ("pinterest", "facebook", "twitter", "tiktok", "amazon.com/s")):
        score -= 40
    return score


def find_datasheet_url(query: str, extra_html: str = "") -> str:
    html_blobs = [extra_html or ""]
    try:
        html_blobs.append(duckduckgo_lite_search(f'{query} datasheet filetype:pdf'))
    except Exception:
        pass

    best = ""
    best_score = 20
    for html in html_blobs:
        for match in PDF_HREF_RE.findall(html or ""):
            url = unescape(match.rstrip(").,;"))
            score = score_datasheet_url(url, query)
            if score > best_score:
                best_score = score
                best = url
    return best


def lookup_product_specs(query: str, force: bool = False) -> dict[str, Any]:
    q = (query or "").strip()
    if len(q) < 2:
        return {"ok": False, "error": "Enter a product name to look up."}

    if not force:
        cached = read_cached_enrich(q)
        if cached:
            return {**cached, "cached": True}

    sources: list[dict[str, Any]] = []
    texts: list[str] = [q]
    image_url = ""
    summary = ""
    extra_html = ""

    wiki = wikipedia_lookup(q)
    if wiki:
        if wiki.get("text"):
            sources.append({"provider": wiki["provider"], "title": wiki["title"], "url": wiki.get("url")})
            texts.append(wiki["text"])
        summary = (wiki.get("extract") or "").strip()
        image_url = wiki.get("image") or ""

    ddg = duckduckgo_lookup(q)
    if ddg and ddg.get("text"):
        sources.append({"provider": ddg["provider"], "title": ddg["title"], "url": ddg.get("url")})
        texts.append(ddg["text"])
        extra_html = ddg.get("text") or ""
        if not image_url:
            image_url = ddg.get("image") or ""

    if not image_url:
        image_url = commons_image_lookup(q)

    combined = "\n\n".join(texts)
    heuristic_specs = extract_specs_from_text(combined)
    ai_specs = openai_enrich(q, combined)
    specs = merge_specs(ai_specs or [], heuristic_specs)

    brand = detect_brand(combined) or detect_brand(q)
    category = detect_category(combined, q)
    model = q
    if brand and q.lower().startswith(brand.lower()):
        model = q[len(brand):].strip(" -") or q

    datasheet_url = find_datasheet_url(q, extra_html)

    if not specs and not sources and not image_url and not datasheet_url:
        return {
            "ok": False,
            "error": (
                "No online product data found. Check internet connectivity "
                "or use a more specific model name."
            ),
            "query": q,
        }

    if not summary:
        summary = (specs and f"{brand or ''} {model}".strip() + " — specifications retrieved from public web sources.") or ""

    result = {
        "ok": True,
        "source": "web",
        "query": q,
        "brand": brand,
        "model": model,
        "category": category,
        "specs": specs,
        "summary": summary[:600],
        "imageUrl": image_url,
        "datasheetUrl": datasheet_url,
        "sources": sources,
        "ai": bool(ai_specs),
        "cached": False,
        "crawled": True,
        "note": (
            "Looked up online only because local catalog data was incomplete. "
            "Review carefully before procurement."
            + (
                " AI enrichment applied."
                if ai_specs
                else " Heuristic extraction used (set OPENAI_API_KEY for smarter fill)."
            )
        ),
    }
    write_cached_enrich(q, result)
    return result


lookup_product_enrich = lookup_product_specs


MARKET_CATEGORY_TERMS = {
    "laptop": "laptop notebook ultrabook thinkpad elitebook latitude",
    "desktop": "desktop workstation optiplex thinkcentre",
    "tablet": "tablet ipad galaxy tab surface",
    "printer": "printer MFP laserjet officejet",
    "server": "server proliant poweredge thinksystem",
    "all": "computer laptop desktop printer server ICT equipment",
}

BRAND_SERIES_HINTS: dict[str, list[str]] = {
    "lenovo": ["ThinkPad", "Yoga", "Legion", "LOQ", "ThinkBook", "IdeaPad", "ThinkStation", "ThinkCentre"],
    "hp": ["EliteBook", "ProBook", "ZBook", "Pavilion", "OMEN", "ProLiant", "LaserJet", "OfficeJet"],
    "hewlett packard": ["EliteBook", "ProBook", "ZBook", "LaserJet", "ProLiant"],
    "hpe": ["ProLiant", "Synergy", "Apollo", "Aruba"],
    "dell": ["Latitude", "Precision", "XPS", "OptiPlex", "PowerEdge", "Inspiron", "Vostro"],
    "apple": ["MacBook", "iMac", "Mac mini", "Mac Studio", "iPad"],
    "microsoft": ["Surface", "Surface Pro", "Surface Laptop"],
    "asus": ["ZenBook", "VivoBook", "ROG", "ExpertBook"],
    "acer": ["Aspire", "Swift", "TravelMate", "Predator"],
    "samsung": ["Galaxy Book", "Galaxy Tab"],
    "canon": ["imageRUNNER", "MAXIFY", "imageCLASS"],
    "brother": ["MFC", "HL-L", "DCP"],
    "cisco": ["Catalyst", "Meraki", "UCS"],
}

MARKET_SKIP_HOSTS = (
    "duckduckgo.com",
    "youtube.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "wikipedia.org",
    "reddit.com",
    "pinterest.com",
    "instagram.com",
    "tiktok.com",
    "amazon.com/s",
    "ebay.com",
)

MANUFACTURER_SKIP_TITLE = re.compile(
    r"\b(login|sign in|sign up|support|driver|download only|careers|contact us|"
    r"privacy|cookie|terms of use|warranty|newsletter|account|cart|"
    r"shop online|learn more about|about us|skip to)\b",
    re.I,
)

MANUFACTURER_SKIP_PATH = re.compile(
    r"/(?:login|signin|signup|support|drivers|careers|privacy|legal|terms|"
    r"contact|newsletter|account|cart|cookie|warranty|accessibility)(?:/|$|[?#])",
    re.I,
)

BRAND_ALIASES: dict[str, str] = {
    "hewlett packard": "hp",
    "hewlett-packard": "hp",
    "alienware": "dell",
}

# Official manufacturer pages — crawled first (most reliable for trends / latest)
MANUFACTURER_SOURCES: dict[str, dict[str, list[str]]] = {
    "hp": {
        "all": ["https://www.hp.com/us-en/home.html"],
        "laptop": [
            "https://www.hp.com/us-en/home.html",
            "https://www.hp.com/us-en/shop/laptops-tablets.html",
        ],
        "desktop": [
            "https://www.hp.com/us-en/home.html",
            "https://www.hp.com/us-en/shop/desktops.html",
        ],
        "tablet": ["https://www.hp.com/us-en/shop/laptops-tablets.html"],
        "printer": [
            "https://www.hp.com/us-en/home.html",
            "https://www.hp.com/us-en/shop/printers.html",
        ],
        "server": ["https://www.hp.com/us-en/shop/workstations.html"],
    },
    "dell": {
        "all": [
            "https://www.dell.com/en-zw/lp",
            "https://www.dell.com/en-us/gaming/alienware",
        ],
        "laptop": [
            "https://www.dell.com/en-zw/lp",
            "https://www.dell.com/en-us/shop/dell-laptops/sc/laptops",
            "https://www.dell.com/en-us/gaming/alienware",
        ],
        "desktop": [
            "https://www.dell.com/en-zw/lp",
            "https://www.dell.com/en-us/shop/desktop-computers/sc/desktops",
        ],
        "tablet": ["https://www.dell.com/en-zw/lp"],
        "server": [
            "https://www.dell.com/en-us/shop/scc/sc/servers",
        ],
    },
    "apple": {
        "all": ["https://www.apple.com/"],
        "laptop": [
            "https://www.apple.com/",
            "https://www.apple.com/mac/",
        ],
        "desktop": [
            "https://www.apple.com/",
            "https://www.apple.com/mac/",
        ],
        "tablet": [
            "https://www.apple.com/",
            "https://www.apple.com/ipad/",
        ],
    },
    "asus": {
        "all": ["https://www.asus.com/"],
        "laptop": [
            "https://www.asus.com/",
            "https://www.asus.com/laptops/",
        ],
        "desktop": [
            "https://www.asus.com/",
            "https://www.asus.com/displays-desktops/tower-pcs/",
        ],
        "tablet": ["https://www.asus.com/mobile-handhelds/tablets/"],
        "server": ["https://www.asus.com/networking-iot-servers/servers/"],
    },
    "lenovo": {
        "all": ["https://www.lenovo.com/us/en/laptops/results/"],
        "laptop": ["https://www.lenovo.com/us/en/laptops/results/"],
        "desktop": ["https://www.lenovo.com/us/en/desktops/"],
        "tablet": ["https://www.lenovo.com/us/en/tablets/"],
        "server": ["https://www.lenovo.com/us/en/servers-storage/"],
    },
}

MANUFACTURER_REFERENCE_URLS: dict[str, str] = {
    "lenovo": "https://www.lenovo.com/us/en/laptops/results/",
    "hp": "https://www.hp.com/us-en/home.html",
    "dell": "https://www.dell.com/en-zw/lp",
    "apple": "https://www.apple.com/",
    "asus": "https://www.asus.com/",
}

PRODUCT_HINT_TERMS = (
    "laptop", "notebook", "desktop", "tablet", "printer", "server", "workstation",
    "thinkpad", "elitebook", "latitude", "probook", "poweredge", "proliant",
    "mfp", "laserjet", "macbook", "surface", "optiplex", "yoga", "legion",
    "switch", "router", "monitor", "workstation",
)

CATEGORY_MATCH_TERMS: dict[str, tuple[str, ...]] = {
    "laptop": (
        "laptop", "notebook", "macbook", "thinkpad", "elitebook", "latitude",
        "probook", "zenbook", "vivobook", "expertbook", "omnibook", "xps",
        "inspiron", "spectre", "pavilion", "yoga", "legion", "chromebook",
        "copilot+ pc", "ai pc",
    ),
    "desktop": (
        "desktop", "imac", "mac mini", "mac studio", "optiplex", "thinkcentre",
        "thinkstation", "workstation", "tower pc", "mini pc", "nuc", "all-in-one",
        "aio", "omnidesk",
    ),
    "tablet": ("tablet", "ipad", "galaxy tab", "surface pro", "zenpad"),
    "printer": ("printer", "laserjet", "officejet", "smart tank", "mfp", "plotter", "inkjet"),
    "server": ("server", "proliant", "poweredge", "thinksystem", "rack"),
    "all": PRODUCT_HINT_TERMS,
}


def normalize_market_brand(brand: str) -> str:
    key = re.sub(r"\s+", " ", (brand or "").strip().lower())
    return BRAND_ALIASES.get(key, key)


def manufacturer_urls_for_brand(brand: str, category: str) -> list[str]:
    key = normalize_market_brand(brand)
    catalog = MANUFACTURER_SOURCES.get(key, {})
    if not catalog:
        return []
    urls: list[str] = []
    for bucket in (category, "all"):
        for url in catalog.get(bucket, []):
            if url not in urls:
                urls.append(url)
    if key == "dell" and "alienware" in brand.lower():
        extra = "https://www.dell.com/en-us/gaming/alienware"
        if extra not in urls:
            urls.insert(0, extra)
    return urls


def resolve_catalog_url(href: str, base_url: str) -> str:
    raw = unescape((href or "").strip())
    if not raw or raw.startswith("#") or raw.lower().startswith("javascript:"):
        return ""
    return urllib.parse.urljoin(base_url, raw)


CATEGORY_EXCLUDE_TERMS: dict[str, tuple[str, ...]] = {
    "server": (
        "laptop", "notebook", "ultrabook", "macbook", "thinkpad", "elitebook",
        "latitude", "chromebook", "probook", "tablet", "ipad",
    ),
    "laptop": ("proliant", "poweredge", "thinksystem", "blade chassis"),
    "desktop": ("laptop", "notebook", "thinkpad", "proliant", "poweredge"),
    "tablet": ("proliant", "poweredge", "laserjet", "rack server"),
    "printer": ("laptop", "thinkpad", "proliant", "poweredge", "macbook"),
}


def category_matches_text(category: str, text: str) -> bool:
    if category == "all":
        return True
    blob = (text or "").lower()
    if any(term in blob for term in CATEGORY_EXCLUDE_TERMS.get(category, ())):
        return False
    return any(term in blob for term in CATEGORY_MATCH_TERMS.get(category, CATEGORY_MATCH_TERMS["all"]))


def is_roundup_listing(title: str, snippet: str = "") -> bool:
    blob = f"{title} {snippet}".lower()
    return bool(re.search(
        r"\bvs\.?\b|\bversus\b|head-to-head|round-?up|how to choose|"
        r"best refurbished|side-by-side|compared|fleet (laptop|pc)|decision guide",
        blob,
    ))


def is_store_landing_listing(title: str, url: str = "") -> bool:
    title_l = (title or "").lower().strip()
    url_l = (url or "").lower()
    if re.search(r"^amazon\.com:|^ebay\.|^walmart\.|^best buy", title_l):
        return True
    if re.search(r"\bfind .+ designed for|\bchoose from\b|\bshop (for|online)\b|\bcategory page\b", title_l):
        return True
    if "amazon." in url_l and re.search(r"/(?:s\?|gp/browse|stores/|b/ref=|b\?node=)", url_l):
        return True
    if re.search(r"/(?:search|browse|category|results)\?", url_l) and not re.search(
        r"/(?:product|dp/|p/|item/)", url_l
    ):
        return True
    return False


def is_benchmark_or_review_listing(title: str, snippet: str = "", url: str = "", category: str = "") -> bool:
    blob = f"{title} {snippet} {url}".lower()
    if re.search(
        r"benchmark|notebookcheck|cpu-monkey|nanoreview|techpowerup|anandtech|"
        r"tom'?s hardware|passmark|cinebench|geekbench|cpubenchmark|hardware times",
        blob,
    ):
        return True
    if re.search(r"\bprocessor\b|\bcpu\b|\bsoc\b|\bchip\b", title or "", re.I):
        laptopish = re.search(
            r"\blaptop\b|\bnotebook\b|\bmacbook\b|\bmobile\b|\bultrabook\b|\bchromebook\b",
            blob,
            re.I,
        )
        if not laptopish and (category or "laptop") in ("laptop", "all"):
            return True
    return False


def is_junk_market_listing(title: str, snippet: str = "", url: str = "", category: str = "laptop") -> bool:
    if is_roundup_listing(title, snippet):
        return True
    if is_store_landing_listing(title, url):
        return True
    if is_benchmark_or_review_listing(title, snippet, url, category):
        return True
    return False


def extract_nearby_image(html: str, anchor_end: int) -> str:
    window = html[max(0, anchor_end - 400): anchor_end + 900]
    for pattern in (
        r'<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"',
        r'<source[^>]+srcset="([^"\s,]+)',
    ):
        m = re.search(pattern, window, re.I)
        if m:
            url = m.group(1).strip()
            if url and not url.startswith("data:"):
                return url
    return ""


def parse_json_ld_products(html: str, brand: str, base_url: str, category: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for block in re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html or "",
        re.I | re.S,
    ):
        try:
            payload = json.loads(block)
        except Exception:
            continue
        nodes = payload if isinstance(payload, list) else [payload]
        for node in nodes:
            if not isinstance(node, dict):
                continue
            if node.get("@graph"):
                nodes.extend(node["@graph"])
                continue
            node_type = str(node.get("@type") or "")
            if node_type not in ("Product", "ProductGroup", "Offer", "ListItem"):
                continue
            title = clean_market_title(str(node.get("name") or node.get("headline") or ""), brand)
            url = resolve_catalog_url(str(node.get("url") or ""), base_url)
            if not title or len(title) < 4:
                continue
            if not category_matches_text(category, f"{title} {url}"):
                continue
            price_text, price_val = extract_price_text(str(node.get("offers") or node.get("price") or ""))
            if isinstance(node.get("offers"), dict) and not price_text:
                price_text, price_val = extract_price_text(json.dumps(node["offers"]))
            image = ""
            img_raw = node.get("image")
            if isinstance(img_raw, str):
                image = img_raw
            elif isinstance(img_raw, list) and img_raw:
                image = str(img_raw[0])
            items.append({
                "id": f"mfg-json-{len(items)}",
                "title": title if brand.lower() in title.lower() else f"{brand} {title}".strip(),
                "subtitle": detect_product_series(title, brand) or category.replace("_", " ").title(),
                "series": detect_product_series(title, brand),
                "url": url or base_url,
                "priceText": price_text,
                "price": price_val,
                "snippet": clean_value(str(node.get("description") or ""))[:220],
                "imageUrl": resolve_catalog_url(image, base_url) if image else "",
                "source": "manufacturer",
                "isNew": bool(re.search(r"\b(202[5-9]|new|latest|gen\s*\d|m[1-9]\b)\b", title, re.I)),
            })
    return items


def parse_manufacturer_catalog_html(
    html: str,
    brand: str,
    page_url: str,
    category: str = "laptop",
    limit: int = 24,
) -> list[dict[str, Any]]:
    """Extract ICT product cards from official manufacturer HTML pages."""
    brand_l = normalize_market_brand(brand)
    parsed_base = urllib.parse.urlparse(page_url)
    base_host = (parsed_base.netloc or "").lower().replace("www.", "")
    seen: set[str] = set()
    items: list[dict[str, Any]] = []

    for row in parse_json_ld_products(html, brand, page_url, category):
        key = row.get("url") or row.get("title")
        if key in seen:
            continue
        seen.add(key)
        items.append(row)
        if len(items) >= limit:
            return items

    for match in re.finditer(
        r'<a\b([^>]*?)href="([^"]+)"([^>]*?)>(.*?)</a>',
        html or "",
        re.I | re.S,
    ):
        pre, href, post, inner = match.groups()
        url = resolve_catalog_url(href, page_url)
        if not url:
            continue
        parsed = urllib.parse.urlparse(url)
        host = (parsed.netloc or "").lower().replace("www.", "")
        if base_host and host and base_host not in host and host not in base_host:
            continue
        if MANUFACTURER_SKIP_PATH.search(parsed.path or ""):
            continue

        attrs = f"{pre} {post}"
        aria = ""
        aria_m = re.search(r'aria-label="([^"]{4,160})"', attrs, re.I)
        if aria_m:
            aria = clean_value(unescape(aria_m.group(1)))
        title = aria or clean_value(unescape(re.sub(r"<[^>]+>", " ", inner)))
        title = clean_market_title(re.sub(r"\s+", " ", title).strip(), brand)
        if len(title) < 4 or len(title) > 140:
            continue
        if MANUFACTURER_SKIP_TITLE.search(title) or is_generic_catalog_title(title):
            continue
        if "registerform" in (url or "").lower() or "/account" in (url or "").lower():
            continue

        blob = f"{title} {url}".lower()
        if brand_l not in blob and not any(h in host for h in (brand_l, "hp.com", "dell.com", "apple.com", "asus.com", "lenovo.com")):
            if not category_matches_text(category, blob):
                continue
        if category != "all" and not category_matches_text(category, blob):
            # Allow prominent homepage promos even when path is generic
            if not re.search(r"\b(new|latest|shop|buy|pre-order|learn more)\b", inner, re.I):
                continue

        if url in seen or title.lower() in seen:
            continue
        seen.add(url)
        seen.add(title.lower())

        tail = html[match.end(): match.end() + 320]
        snippet = clean_value(strip_html(tail))[:220]
        price_text, price_val = extract_price_text(f"{title} {snippet} {inner}")
        series = detect_product_series(title, brand)
        image = extract_nearby_image(html, match.end())
        if image:
            image = resolve_catalog_url(image, page_url)

        display_title = title
        if brand.lower() not in title.lower():
            display_title = f"{brand} {title}".strip()

        items.append({
            "id": f"mfg-{len(items)}",
            "title": display_title,
            "subtitle": series or detect_category(blob, title).replace("_", " ").title(),
            "series": series,
            "url": url,
            "priceText": price_text,
            "price": price_val,
            "snippet": snippet or f"From official {brand} catalog",
            "imageUrl": image,
            "source": "manufacturer",
            "isNew": bool(re.search(r"\b(202[5-9]|new|latest|gen\s*\d|m[1-9]\b|copilot\+)\b", f"{title} {snippet}", re.I)),
        })
        if len(items) >= limit:
            break

    # Headings often carry product names on marketing homepages (Apple, ASUS)
    if len(items) < limit:
        for hm in re.finditer(r"<h[23][^>]*>([^<]{4,100})</h[23]>", html or "", re.I):
            title = clean_market_title(unescape(hm.group(1)), brand)
            if len(title) < 4 or MANUFACTURER_SKIP_TITLE.search(title) or is_generic_catalog_title(title):
                continue
            if not category_matches_text(category, title):
                continue
            if title.lower() in seen:
                continue
            seen.add(title.lower())
            series = detect_product_series(title, brand)
            items.append({
                "id": f"mfg-h-{len(items)}",
                "title": title if brand.lower() in title.lower() else f"{brand} {title}".strip(),
                "subtitle": series or category.replace("_", " ").title(),
                "series": series,
                "url": page_url,
                "priceText": "",
                "price": None,
                "snippet": f"Featured on {brand} official site",
                "imageUrl": "",
                "source": "manufacturer",
                "isNew": bool(re.search(r"\b(202[5-9]|new|latest|m[1-9])\b", title, re.I)),
            })
            if len(items) >= limit:
                break

    return items


def crawl_manufacturer_catalog(brand: str, category: str, limit: int = 24) -> tuple[list[dict[str, Any]], list[str]]:
    urls = manufacturer_urls_for_brand(brand, category)
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    errors: list[str] = []
    for page_url in urls:
        if len(items) >= limit:
            break
        try:
            html = http_get(page_url, timeout=18)
            for row in parse_manufacturer_catalog_html(html, brand, page_url, category, limit=limit):
                key = row.get("url") or row.get("title")
                if key in seen:
                    continue
                seen.add(key)
                items.append(row)
                if len(items) >= limit:
                    break
        except Exception as exc:
            errors.append(f"{page_url}: {exc}")
    return items, errors


def clean_market_title(title: str, brand: str = "") -> str:
    value = clean_value(unescape(title or ""))
    value = value.encode("utf-8", errors="ignore").decode("utf-8")
    value = re.sub(
        r"^(?:shop now|learn more|pre-order|buy|view all|see all|explore|discover|"
        r"official site\s*\||register\s*form)\s*,?\s*",
        "",
        value,
        flags=re.I,
    ).strip(" ,|–-")
    if brand and brand.lower() not in value.lower() and not value.lower().startswith("learn more"):
        prefix = re.match(r"^learn more\s+", value, re.I)
        if prefix:
            value = value[prefix.end():].strip()
    return clean_value(value)


def is_generic_catalog_title(title: str) -> bool:
    t = (title or "").lower()
    if "official site" in t and "|" in t:
        return True
    if is_roundup_listing(title):
        return True
    return bool(re.search(
        r"^(view all|shop all|see all|all laptops|all desktops|gaming laptops|"
        r"official site|shop now|learn more|register form|create an account|"
        r"laptop deals|ai pcs|top rated laptops|copilot\+ pcs)\b",
        title or "",
        re.I,
    ))


def market_item_rank(row: dict[str, Any]) -> int:
    url = (row.get("url") or "").lower()
    title = (row.get("title") or "").lower()
    score = 0
    if row.get("source") == "manufacturer":
        score += 100
    if any(x in url for x in ("/pdp/", "/spd/", "/buy_", "/shop/goto/buy", "/expertbook/", "/thinkpad")):
        score += 50
    if is_generic_catalog_title(row.get("title") or ""):
        score -= 80
    if row.get("price"):
        score += 10
    if row.get("imageUrl"):
        score += 5
    if re.search(r"\b(iphone|ipad|printer|monitor)\b", title) and "macbook" not in title:
        score -= 30
    return score


def normalize_ddg_url(url: str) -> str:
    raw = unescape(url or "").strip()
    if "uddg=" in raw:
        try:
            parsed = urllib.parse.urlparse(raw)
            qs = urllib.parse.parse_qs(parsed.query)
            uddg = qs.get("uddg", [None])[0]
            if uddg:
                return urllib.parse.unquote(uddg)
        except Exception:
            pass
    return raw


def extract_price_text(text: str) -> tuple[str, float | None]:
    blob = text or ""
    for pattern in (
        r"(?:from\s*)?(?:US\$|\$)\s*([\d,]+(?:\.\d{2})?)",
        r"(?:USD|US\s*Dollar)\s*([\d,]+(?:\.\d{2})?)",
        r"([\d,]+(?:\.\d{2})?)\s*USD",
    ):
        m = re.search(pattern, blob, re.I)
        if m:
            raw = m.group(1).replace(",", "")
            try:
                return m.group(0).strip(), float(raw)
            except ValueError:
                return m.group(0).strip(), None
    return "", None


def detect_product_series(title: str, brand: str) -> str:
    hints = BRAND_SERIES_HINTS.get(brand.lower(), [])
    for series in hints:
        if re.search(rf"\b{re.escape(series)}\b", title, re.I):
            return series
    return ""


def parse_ddg_lite_products(
    html: str,
    brand: str,
    limit: int = 24,
    *,
    keyword: str = "",
    require_brand: bool = True,
    category: str = "all",
) -> list[dict[str, Any]]:
    brand_l = normalize_market_brand(brand).lower() if brand else ""
    keyword_l = (keyword or brand or "").lower()
    seen_urls: set[str] = set()
    items: list[dict[str, Any]] = []
    html = html or ""

    for match in re.finditer(
        r'<a[^>]+href="(https?://[^"]+)"[^>]*>([^<]{4,140})</a>',
        html,
        re.I,
    ):
        url = normalize_ddg_url(match.group(1))
        title = clean_value(unescape(re.sub(r"<[^>]+>", " ", match.group(2))))
        if not url or url in seen_urls:
            continue
        url_l = url.lower()
        if any(host in url_l for host in MARKET_SKIP_HOSTS):
            continue
        blob = f"{title} {url}".lower()
        if require_brand and brand_l:
            if brand_l not in blob and brand_l not in url_l:
                if not any(term in blob for term in PRODUCT_HINT_TERMS):
                    continue
        elif keyword_l:
            kw_parts = [p for p in re.split(r"\s+", keyword_l) if len(p) >= 3]
            if kw_parts and not any(part in blob for part in kw_parts):
                if not any(term in blob for term in PRODUCT_HINT_TERMS):
                    continue
        if len(title) < 5:
            continue
        if re.search(r"\b(login|sign in|support|driver|download only|careers|contact us)\b", title, re.I):
            continue
        if is_junk_market_listing(title, snippet="", url=url, category=category or "laptop"):
            continue
        if category and category != "all" and not category_matches_text(category, f"{title} {url}"):
            continue

        tail = html[match.end(): match.end() + 480]
        snippet = clean_value(strip_html(tail))[:220]
        price_text, price_val = extract_price_text(f"{title} {snippet}")
        series = detect_product_series(title, brand or keyword)
        seen_urls.add(url)

        items.append({
            "id": f"web-{len(items)}",
            "title": title,
            "subtitle": series or detect_category(snippet, title).replace("_", " ").title(),
            "series": series,
            "url": url,
            "priceText": price_text,
            "price": price_val,
            "snippet": snippet,
            "imageUrl": "",
            "source": "web",
            "isNew": bool(re.search(r"\b(202[5-9]|new|latest|gen\s*\d)\b", f"{title} {snippet}", re.I)),
        })
        if len(items) >= limit:
            break
    return items


def known_market_brands() -> set[str]:
    keys = set(MANUFACTURER_SOURCES.keys()) | set(BRAND_ALIASES.keys())
    keys |= {b.lower() for b in BRAND_HINTS}
    return keys


def expand_use_case_hints(query: str) -> str:
    extra: list[str] = []
    for pattern, hint in USE_CASE_SEARCH_HINTS:
        if pattern.search(query or ""):
            extra.append(hint)
    return " ".join(extra)


def parse_market_query(raw: str) -> dict[str, str]:
    query = re.sub(r"\s+", " ", (raw or "").strip())
    q_lower = query.lower()
    if not query:
        return {"mode": "empty", "brand": "", "keywords": "", "display": ""}

    if normalize_market_brand(query) in MANUFACTURER_SOURCES:
        return {"mode": "brand", "brand": query, "keywords": "", "display": query}

    brands = sorted(known_market_brands(), key=len, reverse=True)
    for brand_key in brands:
        if q_lower == brand_key or q_lower.startswith(f"{brand_key} "):
            remainder = query[len(brand_key):].strip(" -,")
            if remainder:
                return {
                    "mode": "hybrid",
                    "brand": brand_key.title() if brand_key != "hp" else "HP",
                    "keywords": remainder,
                    "display": query,
                }
            return {"mode": "brand", "brand": brand_key.title() if brand_key != "hp" else "HP", "keywords": "", "display": query}

    return {"mode": "keyword", "brand": "", "keywords": query, "display": query}


def _load_rbz_rate_file() -> dict[str, Any]:
    if RBZ_RATE_PATH.is_file():
        try:
            data = json.loads(RBZ_RATE_PATH.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
        except Exception:
            pass
    return {}


def _parse_rbz_rate_from_html(html: str) -> float | None:
    text = strip_html(html)
    patterns = (
        r"US\s*Dollar[^\d]{0,40}(\d{1,3}\.\d{2,6})",
        r"USD[^\d]{0,40}(\d{1,3}\.\d{2,6})",
        r"Interbank[^\d]{0,80}(\d{1,3}\.\d{2,6})",
        r"(\d{1,3}\.\d{2,6})\s*ZiG[^\d]{0,20}USD",
        r"1\s*USD\s*=\s*(\d{1,3}\.\d{2,6})\s*ZiG",
    )
    for pattern in patterns:
        m = re.search(pattern, text, re.I)
        if m:
            try:
                val = float(m.group(1))
                if 5 < val < 500:
                    return val
            except ValueError:
                continue
    return None


def fetch_rbz_usd_zig_rate(force: bool = False) -> dict[str, Any]:
    env_rate = os.environ.get("RBZ_USD_ZIG_RATE", "").strip()
    if env_rate:
        try:
            val = float(env_rate)
            return {
                "ok": True,
                "usdToZig": val,
                "currency": "ZiG",
                "source": "env",
                "asOf": time.strftime("%Y-%m-%d", time.gmtime()),
                "referenceUrl": RBZ_RATE_URL,
            }
        except ValueError:
            pass

    cached = _load_rbz_rate_file()
    ts = float(cached.get("cachedAt") or 0)
    if not force and ts and (time.time() - ts) < RBZ_RATE_TTL_SECONDS and cached.get("usdToZig"):
        return {**cached, "ok": True, "cached": True}

    rate: float | None = None
    source = "manual"
    note = ""
    try:
        html = http_get(RBZ_RATE_URL, timeout=18)
        if "captcha" in html.lower() or "hcaptcha" in html.lower() or len(html) < 5000:
            note = "RBZ site returned bot-protection page; using cached/manual rate."
        else:
            rate = _parse_rbz_rate_from_html(html)
            if rate:
                source = "rbz"
    except Exception as exc:
        note = f"RBZ fetch failed: {exc}"

    if rate is None:
        rate = float(cached.get("usdToZig") or cached.get("rate") or 26.0)
        source = cached.get("source") or "manual-default"
        if not note:
            note = "Using stored RBZ/manual rate. Update data/rbz-exchange-rate.json from RBZ site."

    payload = {
        "ok": True,
        "usdToZig": round(rate, 4),
        "currency": "ZiG",
        "source": source,
        "asOf": time.strftime("%Y-%m-%d", time.gmtime()),
        "referenceUrl": RBZ_RATE_URL,
        "note": note,
        "cachedAt": time.time(),
        "cached": False,
    }
    try:
        RBZ_RATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        RBZ_RATE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass
    return payload


def format_usd_price(amount: float | None) -> str:
    if amount is None:
        return ""
    return f"US${amount:,.2f}"


def format_zig_price(amount: float | None) -> str:
    if amount is None:
        return ""
    return f"ZiG {amount:,.2f}"


def apply_zimbabwe_pricing(items: list[dict[str, Any]], rate_info: dict[str, Any]) -> None:
    rate = float(rate_info.get("usdToZig") or 0)
    if rate <= 0:
        return
    for row in items:
        usd = row.get("price")
        if usd is None and row.get("priceText"):
            _, usd = extract_price_text(row.get("priceText") or "")
        if usd is None:
            continue
        try:
            usd_val = float(usd)
        except (TypeError, ValueError):
            continue
        zig_val = round(usd_val * rate, 2)
        row["priceUsd"] = usd_val
        row["priceZiG"] = zig_val
        row["priceText"] = f"{format_usd_price(usd_val)} · {format_zig_price(zig_val)}"
        row["priceDisplay"] = row["priceText"]


def compute_price_benchmarks(items: list[dict[str, Any]], rate_info: dict[str, Any]) -> dict[str, Any]:
    usd_vals = [float(r["priceUsd"]) for r in items if r.get("priceUsd") is not None]
    if not usd_vals:
        return {"sampleCount": 0}
    rate = float(rate_info.get("usdToZig") or 0)
    min_usd = min(usd_vals)
    max_usd = max(usd_vals)
    avg_usd = sum(usd_vals) / len(usd_vals)
    bench = {
        "sampleCount": len(usd_vals),
        "minUsd": round(min_usd, 2),
        "maxUsd": round(max_usd, 2),
        "avgUsd": round(avg_usd, 2),
        "minUsdText": format_usd_price(min_usd),
        "maxUsdText": format_usd_price(max_usd),
        "avgUsdText": format_usd_price(avg_usd),
    }
    if rate > 0:
        bench.update({
            "minZiG": round(min_usd * rate, 2),
            "maxZiG": round(max_usd * rate, 2),
            "avgZiG": round(avg_usd * rate, 2),
            "minZiGText": format_zig_price(min_usd * rate),
            "maxZiGText": format_zig_price(max_usd * rate),
            "avgZiGText": format_zig_price(avg_usd * rate),
        })
    return bench


def lookup_market_catalog(query: str, category: str = "laptop", force: bool = False) -> dict[str, Any]:
    parsed = parse_market_query(query)
    category = (category or "laptop").strip().lower()
    if parsed["mode"] == "empty" or len(parsed.get("display") or "") < 2:
        return {"ok": False, "error": "Enter a brand or keywords (e.g. gaming laptop, architecture workstation)."}

    brand = parsed.get("brand") or ""
    keywords = parsed.get("keywords") or parsed.get("display") or query
    mode = parsed["mode"]
    cache_q = f"market:{mode}:{keywords.lower()}:{brand.lower()}:{category}:v3"
    if not force:
        cached = read_cached_enrich(cache_q)
        if cached:
            return {**cached, "cached": True}

    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    errors: list[str] = []
    manufacturer_pages: list[str] = []
    use_case_hint = expand_use_case_hints(keywords)

    # 1) Official manufacturer sites when a known brand is present
    if brand and mode in ("brand", "hybrid"):
        mfg_items, mfg_errors = crawl_manufacturer_catalog(brand, category, limit=24)
        manufacturer_pages = manufacturer_urls_for_brand(brand, category)
        errors.extend(mfg_errors)
        for row in mfg_items:
            if mode == "hybrid" and keywords:
                blob = f"{row.get('title', '')} {row.get('snippet', '')}".lower()
                kw_parts = [p for p in re.split(r"\s+", keywords.lower()) if len(p) >= 3]
                if kw_parts and not any(part in blob for part in kw_parts):
                    if not use_case_hint or not any(
                        part in blob for part in re.split(r"\s+", use_case_hint.lower()) if len(part) >= 4
                    ):
                        continue
            key = row.get("url") or row.get("title")
            if key in seen:
                continue
            seen.add(key)
            items.append(row)

    # 2) Public web search — brand, hybrid, or pure keyword
    cat_terms = MARKET_CATEGORY_TERMS.get(category, MARKET_CATEGORY_TERMS["laptop"])
    search_seed = " ".join(part for part in [brand, keywords, use_case_hint, cat_terms] if part).strip()
    queries = [
        f"{search_seed} buy specifications 2025 2026",
        f"{search_seed} official model datasheet",
        f"{search_seed} rackmount price USD" if category == "server" else f"{search_seed} specifications latest models",
    ]
    if brand:
        brand_slug = re.sub(r"[^a-z0-9]", "", normalize_market_brand(brand))
        if brand_slug:
            queries.append(f"site:{brand_slug}.com {search_seed}")

    label_for_parse = brand or keywords
    for q in queries:
        if len(items) >= 24:
            break
        try:
            html = duckduckgo_lite_search(q)
            for row in parse_ddg_lite_products(
                html,
                label_for_parse,
                limit=24,
                keyword=keywords,
                require_brand=bool(brand and mode == "brand"),
                category=category,
            ):
                key = row.get("url") or row.get("title")
                if key in seen:
                    continue
                seen.add(key)
                items.append(row)
        except Exception as exc:
            errors.append(str(exc))

    fill_product_images(items, limit=12)

    items = [
        row for row in items
        if not is_junk_market_listing(
            row.get("title") or "",
            row.get("snippet") or "",
            row.get("url") or "",
            category,
        )
        and (category == "all" or category_matches_text(
            category,
            f"{row.get('title', '')} {row.get('snippet', '')} {row.get('url', '')}",
        ))
    ]

    if category == "laptop":
        items = [
            row for row in items
            if not re.search(r"\b(iphone|ipad|printer|monitor|toner)\b", (row.get("title") or ""), re.I)
            or re.search(r"\bmacbook\b", (row.get("title") or ""), re.I)
        ]

    items.sort(key=market_item_rank, reverse=True)

    if not items:
        return {
            "ok": False,
            "error": (
                f"No ICT equipment listings found for “{parsed.get('display')}”. "
                "Try gaming laptop, architecture workstation, HP EliteBook, or Dell Latitude."
            ),
            "query": parsed.get("display"),
            "searchMode": mode,
            "category": category,
            "details": errors[:2],
        }

    rate_info = fetch_rbz_usd_zig_rate(force=force)
    apply_zimbabwe_pricing(items, rate_info)
    benchmarks = compute_price_benchmarks(items, rate_info)

    series_list = sorted({
        s for s in (row.get("series") or "" for row in items) if s
    })

    brand_key = normalize_market_brand(brand) if brand else ""
    mfg_count = sum(1 for row in items if row.get("source") == "manufacturer")

    result = {
        "ok": True,
        "query": parsed.get("display"),
        "brand": brand,
        "keywords": keywords,
        "searchMode": mode,
        "category": category,
        "items": items[:24],
        "count": min(len(items), 24),
        "series": series_list,
        "crawledAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": "manufacturer+web" if mfg_count else "web",
        "manufacturerCount": mfg_count,
        "manufacturerPages": manufacturer_pages,
        "exchangeRate": rate_info,
        "priceBenchmarks": benchmarks,
        "cached": False,
        "disclaimer": (
            "Official manufacturer pages are crawled when a brand is recognised; keyword searches use "
            "public web listings. USD prices converted to ZiG using RBZ prevailing bank rate "
            f"({RBZ_RATE_URL}). Verify specs and prices before procurement."
        ),
        "referenceUrl": MANUFACTURER_REFERENCE_URLS.get(brand_key, ""),
    }
    write_cached_enrich(cache_q, result)
    return result


def lookup_brand_market_catalog(brand: str, category: str = "laptop", force: bool = False) -> dict[str, Any]:
    return lookup_market_catalog(brand, category=category, force=force)
