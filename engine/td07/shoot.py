#!/usr/bin/env python3
"""Rend les images clés TD07 (styleframes.html) en PNG + planche, et exporte le JSON pour Figma.
Usage : python3 engine/td07/shoot.py SORTIE_DIR [indices séparés par des virgules]"""
import asyncio, functools, http.server, json, socketserver, sys, threading
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


async def main():
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'])
        p = await b.new_page(viewport={'width': 1080, 'height': 1920})
        errs = []
        p.on('pageerror', lambda e: errs.append(str(e)))
        await p.goto(f'http://127.0.0.1:{srv.server_address[1]}/engine/td07/styleframes.html')
        await p.wait_for_function('window.__ready === true', timeout=60000)
        n = await p.evaluate('window.FRAME_COUNT')
        idx = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else list(range(n))
        tiles, exp = [], []
        for i in idx:
            data = await p.evaluate('(i)=>exportFrame(i)', i)
            exp.append(data)
            png = OUT / f'sf_{i:02d}.png'
            await p.screenshot(path=str(png))
            tiles.append(png)
        (OUT / 'export.json').write_text(json.dumps(exp, ensure_ascii=False))
        tw, th = 360, 640
        sheet = Image.new('RGB', (len(tiles) * tw, th + 26), (30, 30, 30))
        d = ImageDraw.Draw(sheet)
        for k, t in enumerate(tiles):
            sheet.paste(Image.open(t).convert('RGB').resize((tw, th)), (k * tw, 26))
            d.text((k * tw + 6, 6), exp[k]['name'], fill=(255, 255, 255))
        sheet.save(OUT / 'sheet.jpg', quality=90)
        print('errors:', errs[:5])
        await b.close()

asyncio.run(main())
