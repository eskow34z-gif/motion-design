#!/usr/bin/env python3
"""Génère le script use_figma d'une image clé TD07 à partir de export.json (shoot.py).
Usage : python3 engine/td07/figma_code.py export.json INDEX > code.js"""
import json, sys

data = json.load(open(sys.argv[1], encoding='utf-8'))
i = int(sys.argv[2])
F = data[i]
import re
svg = re.sub(r'>\s+<', '><', F['svg'])
svg = re.sub(r'(\d+\.\d\d)\d+', r'\1', svg)
payload = {'name': F['name'], 'bg': F['bg'], 'svg': svg, 'dots': F['dots'], 'idx': i,
           'texts': [{k: (round(v, 1) if isinstance(v, float) else v) for k, v in t.items()} for t in F['texts']]}

code = r"""
const D = __DATA__;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
const STY = { 800: '96pt ExtraBold', 600: 'SemiBold', 500: 'Medium' };
await Promise.all([...new Set(D.texts.map((t) => STY[t.wt] || '96pt ExtraBold'))].map((st) => figma.loadFontAsync({ family: 'Bricolage Grotesque', style: st })));
const page = figma.currentPage;
const old = page.children.find((n) => n.type === 'FRAME' && n.name === D.name);
if (old) old.remove();
const fr = figma.createFrame();
fr.name = D.name; fr.resize(1080, 1920); fr.x = D.idx * 1200; fr.y = 0;
fr.fills = [{ type: 'SOLID', color: hex(D.bg) }]; fr.clipsContent = true;
const ids = [fr.id];
/* trames de points : un seul vecteur par trame */
for (const [x0, y0, w, h, gap, r, col, op] of D.dots) {
  const X0 = +x0, Y0 = +y0, Wd = +w, Hd = +h, G = +gap, R = +r;
  let d = '';
  for (let y = Y0; y < Y0 + Hd; y += G) {
    const row = Math.round((y - Y0) / G);
    for (let x = X0 + ((row % 2) * G) / 2; x < X0 + Wd; x += G)
      d += `M${(x - R).toFixed(1)},${y.toFixed(1)}a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0`;
  }
  const n = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><path d="${d}" fill="${col}"/></svg>`);
  n.name = 'Trame'; n.opacity = +op; n.fills = [];
  fr.appendChild(n); n.x = 0; n.y = 0; ids.push(n.id);
}
const art = figma.createNodeFromSvg(D.svg);
art.name = 'Illustration'; art.fills = [];
fr.appendChild(art); art.x = 0; art.y = 0; ids.push(art.id);
/* textes éditables */
const tg = [];
for (const t of D.texts) {
  const tx = figma.createText();
  tx.fontName = { family: 'Bricolage Grotesque', style: STY[t.wt] || '96pt ExtraBold' };
  tx.characters = t.s;
  tx.fontSize = t.size;
  tx.lineHeight = { unit: 'PIXELS', value: t.lh };
  tx.letterSpacing = { unit: 'PERCENT', value: -2.5 };
  tx.fills = [{ type: 'SOLID', color: hex(t.c) }];
  tx.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (t.center) tx.textAlignHorizontal = 'CENTER';
  if (t.shadow) tx.effects = [{ type: 'DROP_SHADOW', color: { ...hex('#241A45'), a: 1 }, offset: { x: 10, y: 12 }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL' }];
  fr.appendChild(tx);
  if (t.rot) {
    tx.rotation = -t.rot;
    const bb = tx.absoluteBoundingBox;
    tx.x += fr.x + t.cx - (bb.x + bb.width / 2);
    tx.y += fr.y + t.cy + t.lh / 2 - (bb.y + bb.height / 2);
  } else if (t.center && t.cx != null) {
    tx.x = t.cx - tx.width / 2; tx.y = t.y;
  } else { tx.x = t.x; tx.y = t.y; }
  tx.name = t.s.slice(0, 30);
  ids.push(tx.id); tg.push(tx.id);
}
return { frame: fr.id, nodes: ids.length, texts: tg.length };
""".replace('__DATA__', json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
sys.stdout.write(code)
