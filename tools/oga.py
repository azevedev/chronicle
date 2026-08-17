#!/usr/bin/env python3
"""oga.py — inspect OpenGameArt submissions for CC0-only audio.

  search <term>...       list sound-effect submissions matching each term
  info   <path>...       licence + attached files for /content/... submissions

A submission is only usable here if EVERY licence listed on it is CC0, since
the repo is public and redistributes the files verbatim.
"""
import html
import re
import sys
import urllib.parse
import urllib.request

BASE = "https://opengameart.org"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
AUDIO_EXT = (".wav", ".ogg", ".mp3", ".flac", ".aiff", ".zip", ".7z")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf8", "replace")


def text(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def search(term, art_type=13):
    """art_type 13 = Sound Effect, 12 = Music."""
    q = urllib.parse.urlencode(
        {"keys": term, "field_art_type_tid[]": art_type, "sort_by": "count", "sort_order": "DESC"}
    )
    page = get(f"{BASE}/art-search-advanced?{q}")
    out, seen = [], set()
    for href, title in re.findall(r'href="(/content/[^"]+)"[^>]*>([^<]{3,90})<', page):
        if href in seen or href.endswith("/faq"):
            continue
        seen.add(href)
        out.append((href, html.unescape(title).strip()))
    return out


def info(path):
    page = get(BASE + path if path.startswith("/") else path)

    licences = sorted(
        set(
            text(m)
            for m in re.findall(
                r'<span class="field-content">\s*(?:<a[^>]*>)?\s*([^<]*(?:CC0|CC-BY|GPL|OGA|LGPL|Public Domain)[^<]*)',
                page,
                re.I,
            )
        )
    )
    if not licences:
        licences = sorted(set(re.findall(r"(CC0|CC-BY-SA 3\.0|CC-BY 3\.0|CC-BY 4\.0|GPL 3\.0|GPL 2\.0|OGA-BY 3\.0)", page)))

    files = []
    for href in re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+)"', page):
        if href.lower().endswith(AUDIO_EXT) and href not in files:
            files.append(href)

    title_m = re.search(r"<title>([^<]+)</title>", page)
    author_m = re.search(r'href="/users/([^"]+)"', page)

    return {
        "path": path,
        "title": html.unescape(title_m.group(1)).replace("| OpenGameArt.org", "").strip() if title_m else "",
        "author": urllib.parse.unquote(author_m.group(1)) if author_m else "",
        "licences": licences,
        "cc0_only": bool(licences) and all("cc0" in l.lower() for l in licences),
        "files": files,
    }


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "search":
        for term in args:
            print(f"\n=== {term} ===")
            for href, title in search(term):
                print(f"  {href:52} {title[:60]}")
    elif cmd == "info":
        for p in args:
            d = info(p)
            mark = "CC0-ONLY" if d["cc0_only"] else "MIXED/NO"
            print(f"\n[{mark}] {d['title']}  — by {d['author']}")
            print(f"  {BASE}{d['path']}")
            print(f"  licences: {', '.join(d['licences']) or '?'}")
            for f in d["files"]:
                print(f"    {f}")
    else:
        sys.exit(__doc__)
