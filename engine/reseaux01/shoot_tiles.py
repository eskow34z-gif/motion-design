#!/usr/bin/env python3
"""Capture les affiches finies (sans caméra ni flash) pour le mur final et le broyeur du CPE.
Usage : python3 engine/reseaux01/shoot_tiles.py   → engine/reseaux01/tiles/*.png"""
import asyncio, functools, http.server, socketserver, threading
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / 'tiles'
OUT.mkdir(exist_ok=True)
# nom, temps, sans odomètre
TILES = [('s1', 3.45, True), ('s2', 6.95, True), ('s3', 10.95, True), ('s4', 14.9, True), ('s5', 16.95, True),
         ('s6', 20.95, True), ('s7', 24.9, True)]


def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


async def main():
    srv, port = serve()
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-gpu'])
        p = await b.new_page(viewport={'width': 1080, 'height': 1920})
        errs = []
        p.on('pageerror', lambda e: errs.append(str(e)))
        await p.goto(f'http://127.0.0.1:{port}/engine/reseaux01/scene.html?tile=1')
        await p.wait_for_function('window.__ready === true', timeout=120000)
        for name, t, no in TILES:
            await p.evaluate('([t,no]) => renderAt(t, {tile: true})', [t, no])
            await p.wait_for_timeout(80)
            (OUT / f'{name}.png').write_bytes(await p.screenshot(type='png'))
            print('tuile', name, t)
        print('erreurs :', errs[:5])
        await b.close()
    srv.shutdown()

asyncio.run(main())
