#!/usr/bin/env bash
# MANIF01 : textures → tuiles du mur → son (−14 LUFS) → rendu 1080×1920 30 i/s avec flou de bougé.
# Usage : engine/manif01/build.sh sortie.mp4
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${1:-outputs/MANIF01-la-rue-a-de-la-memoire.mp4}"
TMP="$(mktemp -d)"
[ -f engine/manif01/tex/paper.png ] || python3 engine/manif01/make_textures.py
python3 engine/manif01/shoot_tiles.py
python3 engine/manif01/audio.py "$TMP/raw.wav"
J=$(ffmpeg -hide_banner -i "$TMP/raw.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r II ITP ILRA ITH OFS <<< "$(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/raw.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFS:linear=true,aresample=48000" "$TMP/final.wav"
python3 engine/render.py --html engine/manif01/scene.html --cpu --sub 3 --crf 20 --vf "noise=c0s=7:c0f=t+u:c1s=3:c2s=3" --audio "$TMP/final.wav" --out "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | head -2
cp "$TMP/final.wav" "${OUT%.mp4}.wav"
rm -rf "$TMP"
