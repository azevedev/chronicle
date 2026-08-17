#!/usr/bin/env python3
"""commons.py — vet and fetch Wikimedia Commons audio.

Two subcommands:

  search <term>...   keyword search across audio files, printing licence inline
  info   <title>...  full licence / author / URL for specific File: titles

Only CC0 and public-domain files are acceptable here: the game repo is public,
so anything with an attribution or share-alike condition on redistribution is
rejected outright rather than vendored.
"""
import json
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "chronicle-game-assetbot/1.0 (offline history game; contact via repo)"

OK_LICENCES = ("cc0", "pd", "public domain")


def api(**params):
    params.setdefault("format", "json")
    params.setdefault("action", "query")
    url = API + "?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def strip(html):
    out, depth = [], 0
    for ch in html or "":
        if ch == "<":
            depth += 1
        elif ch == ">":
            depth -= 1
        elif depth == 0:
            out.append(ch)
    return "".join(out).strip()


def info(titles):
    """-> list of dicts for the given File: titles."""
    rows = []
    for i in range(0, len(titles), 20):
        d = api(
            titles="|".join(titles[i : i + 20]),
            prop="imageinfo",
            iiprop="url|size|mime|extmetadata",
        )
        for p in d.get("query", {}).get("pages", {}).values():
            ii = (p.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata", {})

            def g(k):
                return strip(em.get(k, {}).get("value", ""))

            lic = (g("LicenseShortName") or em.get("License", {}).get("value", "")).strip()
            rows.append(
                {
                    "title": p.get("title", ""),
                    "missing": "missing" in p,
                    "licence": lic,
                    "author": g("Artist"),
                    "credit": g("Credit"),
                    "desc": g("ImageDescription")[:150],
                    "url": ii.get("url", "").split("?")[0],
                    "size": ii.get("size", 0),
                    "mime": ii.get("mime", ""),
                }
            )
    return rows


def free(row):
    lo = row["licence"].lower()
    return any(k in lo for k in OK_LICENCES)


def show(rows):
    for r in rows:
        if r["missing"]:
            print(f"  !! MISSING  {r['title']}")
            continue
        mark = "OK " if free(r) else "NO "
        kb = r["size"] / 1024
        print(f"  {mark} [{r['licence'] or '?'}] {r['title']}  ({kb:.0f} KB, {r['mime']})")
        if free(r):
            print(f"        by {r['author'] or 'n/a'}")
            print(f"        {r['url']}")


def search(term, limit=25):
    d = api(list="search", srsearch=f"filetype:audio {term}", srnamespace=6, srlimit=limit)
    titles = [r["title"] for r in d.get("query", {}).get("search", [])]
    return info(titles) if titles else []


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "search":
        for term in args:
            print(f"\n=== {term} ===")
            rows = [r for r in search(term) if free(r)]
            if not rows:
                print("   (no CC0/PD results)")
            show(rows)
    elif cmd == "info":
        show(info(args))
    else:
        sys.exit(__doc__)
