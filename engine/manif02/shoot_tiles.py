#!/usr/bin/env python3
"""MANIF02 : capture chaque élément fini (tirage, 4 cartes, affiche) sur fond transparent pour le mur final.
Usage : python3 engine/manif02/shoot_tiles.py   → engine/manif02/tiles/*.png"""
import asyncio, functools, http.server, socketserver, threading
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / 'tiles'; OUT.mkdir(exist_ok=True)


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
        errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        await p.goto(f'http://127.0.0.1:{port}/engine/manif02/scene.html?tile=1')
        await p.wait_for_function('window.__ready === true', timeout=120000)
        times = await p.evaluate('window.TILE_TIMES')
        for name, t in times.items():
            await p.evaluate('([t,n]) => renderAt(t, {only: n})', [t, name])
            await p.wait_for_timeout(120)
            r = await p.evaluate('(n) => { const b = window.TILE_EL[n].getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }', name)
            m = 0 if name == 'poster' else 46
            x0, y0 = max(0, r[0] - m), max(0, r[1] - m)
            x1, y1 = min(1080, r[0] + r[2] + m), min(1920, r[1] + r[3] + m)
            await p.screenshot(path=str(OUT / f'{name}.png'), omit_background=True, clip={'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0})
            print('tuile', name, round(t, 2), [round(v) for v in (x0, y0, x1 - x0, y1 - y0)])
        print('erreurs :', errs[:5])
        await b.close()
    srv.shutdown()

asyncio.run(main())
