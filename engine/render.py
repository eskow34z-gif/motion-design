#!/usr/bin/env python3
"""Rendu déterministe d'une scène HTML (fonction renderAt(t)) en MP4.

Exemples :
  python3 engine/render.py --html engine/theme01.html --frames 0.8,1.8,3.2 --sheet /tmp/sheet.jpg
  python3 engine/render.py --html engine/theme01.html --audio /tmp/a.wav --out outputs/video.mp4
"""
import argparse, asyncio, functools, http.server, os, socketserver, subprocess, sys, threading
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
CHROME = next((p for p in ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'] if os.path.exists(p)), None)


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', required=True)
    ap.add_argument('--width', type=int, default=1080)
    ap.add_argument('--height', type=int, default=1920)
    ap.add_argument('--frames', default='')
    ap.add_argument('--sheet', default='')
    ap.add_argument('--audio', default='')
    ap.add_argument('--out', default='')
    ap.add_argument('--crf', default='18')
    ap.add_argument('--sub', type=int, default=1, help="sous-images par image pour le flou de bougé (1 = désactivé)")
    ap.add_argument('--x264', default='', help="paramètres x264, ex. aq-mode=3")
    ap.add_argument('--start', type=float, default=0.0)
    ap.add_argument('--until', type=float, default=0.0)
    a = ap.parse_args()

    srv, port = serve()
    rel = Path(a.html).resolve().relative_to(ROOT).as_posix()
    async with async_playwright() as pw:
        kw = {'executable_path': CHROME} if CHROME else {}
        browser = await pw.chromium.launch(args=['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'], **kw)
        page = await browser.new_page(viewport={'width': a.width, 'height': a.height})
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await page.goto(f'http://127.0.0.1:{port}/{rel}')
        await page.wait_for_function('window.__ready === true', timeout=60000)
        dur = await page.evaluate('window.__dur')
        fps = await page.evaluate('window.__fps')

        if a.frames:
            from PIL import Image
            ts = [float(x) for x in a.frames.split(',')]
            tiles = []
            for t in ts:
                await page.evaluate('(t)=>renderAt(t)', t)
                await page.wait_for_timeout(60)
                png = await page.screenshot(type='png')
                p = Path(a.sheet or '/tmp/sheet.jpg').with_name(f'f_{t:05.2f}.png')
                p.write_bytes(png)
                tiles.append((t, p))
            cols = min(6, len(tiles))
            rows = (len(tiles) + cols - 1) // cols
            tw, th = 360, 640
            sheet = Image.new('RGB', (cols * tw, rows * (th + 24)), (20, 20, 20))
            from PIL import ImageDraw
            dr = ImageDraw.Draw(sheet)
            for i, (t, p) in enumerate(tiles):
                im = Image.open(p).convert('RGB').resize((tw, th))
                x, y = (i % cols) * tw, (i // cols) * (th + 24)
                sheet.paste(im, (x, y + 24))
                dr.text((x + 6, y + 6), f't={t:.2f}s', fill=(255, 255, 255))
            sheet.save(a.sheet or '/tmp/sheet.jpg', quality=88)
            print('errors:', errs[:5])

        if a.out:
            n = int(round(dur * fps))
            sub = max(1, a.sub)
            if sub == 1:
                cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'mjpeg', '-i', '-']
            else:  # flou de bougé réel : moyenne de sous-images (obturateur 180°)
                cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                       '-s', f'{a.width}x{a.height}', '-framerate', str(fps), '-i', '-']
            if a.audio:
                cmd += ['-i', a.audio]
            cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', a.crf, '-pix_fmt', 'yuv420p', '-r', str(fps)]
            if a.x264:
                cmd += ['-x264-params', a.x264]
            if a.audio:
                cmd += ['-c:a', 'aac', '-b:a', '192k', '-shortest']
            cmd += ['-movflags', '+faststart', a.out]
            ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            if sub > 1:
                import io
                import numpy as np
                from PIL import Image
            i0 = int(round(a.start * fps)); i1 = int(round(a.until * fps)) if a.until else n
            for i in range(i0, i1):
                t = i / fps
                if sub == 1:
                    await page.evaluate('(t)=>renderAt(t)', t)
                    jpg = await page.screenshot(type='jpeg', quality=94)
                    ff.stdin.write(jpg)
                else:
                    acc = None
                    for k in range(sub):
                        ts = max(0.0, min(dur - 1e-3, t + (k / (sub - 1) - 0.5) * 0.5 / fps))
                        await page.evaluate('(t)=>renderAt(t)', ts)
                        jpg = await page.screenshot(type='jpeg', quality=95)
                        im = np.asarray(Image.open(io.BytesIO(jpg)).convert('RGB'), dtype=np.float32)
                        acc = im if acc is None else acc + im
                    ff.stdin.write(np.clip(acc / sub + 0.5, 0, 255).astype(np.uint8).tobytes())
                if i % 30 == 0:
                    print(f'frame {i}/{n}', flush=True)
            ff.stdin.close()
            ff.wait()
            print('errors:', errs[:5])
        await browser.close()
    srv.shutdown()


asyncio.run(main())
