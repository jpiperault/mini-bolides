#!/usr/bin/env python3
"""Reçoit les journaux de Mini Bolides envoyés par les versions de test, sur le réseau local."""
import base64, json, pathlib, secrets, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DIR = pathlib.Path(__file__).resolve().parent.parent / 'journaux'
PORT, MAX_SIZE, MAX_FILES = 8791, 4 * 1024 * 1024, 500


def save_captures(data, folder):
    """Sort les captures d'écran du JSON : des .jpg à côté, plus faciles à regarder."""
    caps = (data.get('graphique') or {}).get('captures') or []
    for n, cap in enumerate(caps):
        img = str(cap.get('img') or '')
        if not img.startswith('data:image/jpeg;base64,'):
            continue
        folder.mkdir(exist_ok=True)
        quoi = ''.join(c for c in str(cap.get('quoi', '')) if c.isalnum())[:20]
        f = folder / f"{n:02d}-{max(0.0, float(cap.get('at') or 0)):05.1f}s-{quoi}.jpg"
        try:
            f.write_bytes(base64.b64decode(img.split(',', 1)[1]))
        except ValueError:
            continue
        cap['img'] = f'{folder.name}/{f.name}'


class Handler(BaseHTTPRequestHandler):
    def reply(self, code, text):
        body = text.encode()
        self.send_response(code)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != '/health':
            return self.reply(404, 'absent')
        self.reply(200, str(len(list(DIR.glob('*.json')))))

    def do_POST(self):
        size = int(self.headers.get('Content-Length') or 0)
        if self.path != '/journal' or not 0 < size <= MAX_SIZE:
            return self.reply(400, 'refusé')
        try:
            data = json.loads(self.rfile.read(size))
            track = str(data['meta']['track'])
        except (ValueError, KeyError, TypeError):
            return self.reply(400, 'illisible')
        if len(list(DIR.glob('*.json'))) >= MAX_FILES:
            return self.reply(507, 'plein')
        safe = ''.join(c for c in track if c.isalnum())[:20]
        name = f"{time.strftime('%Y%m%d-%H%M%S')}-{safe}-{secrets.token_hex(2)}.json"
        save_captures(data, DIR / name[:-5])
        (DIR / name).write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
        print('reçu', name, flush=True)
        self.reply(200, 'ok')

    def log_message(self, *args):
        pass


DIR.mkdir(exist_ok=True)
ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
