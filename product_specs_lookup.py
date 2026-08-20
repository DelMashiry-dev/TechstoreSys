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
        lite_url = "https://lite.duckduckgo.com/lite/?" + urllib.parse.urlencode(
            {"q": f"{query} specs processor ram storage display"}
        )
        lite_html = http_get(lite_url)
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


def write_cached_enrich(query: str, result: dict[str, Any]) -> None:
    key = cache_key(query)
    if not key or not result.get("ok"):
        return
    with _cache_lock:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        data = _load_cache_file()
        data[key] = {"cachedAt": time.time(), "result": result}
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
    best_score = -1
    qbits = set(re.findall(r"[a-z0-9]{3,}", query.lower()))
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        mime = str(info.get("mime") or "").lower()
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        candidate = info.get("thumburl") or info.get("url") or ""
        if not candidate:
            continue
        title = str(page.get("title") or "").lower()
        score = 10
        for bit in qbits:
            if bit in title or bit in candidate.lower():
                score += 8
        if "logo" in title or "icon" in title:
            score -= 20
        if score > best_score:
            best_score = score
            best = candidate
    return best


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
        lite_url = "https://lite.duckduckgo.com/lite/?" + urllib.parse.urlencode(
            {"q": f'{query} datasheet filetype:pdf'}
        )
        html_blobs.append(http_get(lite_url))
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
