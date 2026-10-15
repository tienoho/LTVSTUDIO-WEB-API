import urllib.request

for path in ['/', '/lookup', '/admin', '/docs']:
    url = f"http://localhost:8080{path}"
    resp = urllib.request.urlopen(url)
    html = resp.read().decode('utf-8')
    has_root = '<div id="root">' in html
    has_assets = 'assets/index-' in html
    print(f"Path: {path:8} | Status: {resp.status} | Has root: {has_root} | Has assets: {has_assets}")
