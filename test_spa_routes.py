import subprocess
import time
import urllib.request
import os

PROJ = r"D:\Project\LTVSTUDIO_WEB_API\web_api"
TSX_CLI = os.path.join(PROJ, "node_modules", "tsx", "dist", "cli.mjs")

proc = None
try:
    urllib.request.urlopen("http://localhost:8080/api/health", timeout=1)
except Exception:
    proc = subprocess.Popen(["node", TSX_CLI, "server.ts"], cwd=PROJ, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

try:
    for path in ['/', '/lookup', '/admin', '/docs']:
        url = f"http://localhost:8080{path}"
        resp = urllib.request.urlopen(url)
        html = resp.read().decode('utf-8')
        has_root = '<div id="root">' in html
        has_assets = 'assets/index-' in html
        print(f"Path: {path:8} | Status: {resp.status} | Has root: {has_root} | Has assets: {has_assets}")
        assert resp.status == 200
        assert has_root is True
        assert has_assets is True
    print("All SPA routes served React build correctly!")
finally:
    if proc:
        proc.kill()

