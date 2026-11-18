#!/usr/bin/env python3
"""Tell search engines (Bing, Yandex, Naver, Seznam and others via IndexNow) that the site changed.

    python3 tools/indexnow.py            # submits every URL in the live sitemap

Run it after a push has deployed (about a minute). The key file at the site root proves ownership;
keep it in the repo. Google does not use IndexNow; it reads the sitemap through Search Console.
"""
import json, re, sys, urllib.request

SITE = "https://cortriatriatum.github.io/me/"
KEY = "f2c54b12d47404b0be436884b1f8e747"

xml = urllib.request.urlopen(SITE + "sitemap.xml", timeout=30).read().decode()
urls = re.findall(r"<loc>(.*?)</loc>", xml) + [SITE + "llms.txt"]
body = json.dumps({"host": "cortriatriatum.github.io", "key": KEY,
                   "keyLocation": SITE + KEY + ".txt", "urlList": urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                             headers={"Content-Type": "application/json; charset=utf-8"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"IndexNow accepted {len(urls)} URLs (HTTP {r.status})")
except urllib.error.HTTPError as e:
    sys.exit(f"IndexNow refused: HTTP {e.code} {e.read().decode()[:200]}")
