#!/usr/bin/env bash
# SOURCE01 : tuiles du mur → bruitages (−14 LUFS, crête ≤ −1 dBFS après AAC) → rendu 1080×1920 30 i/s avec flou de bougé.
# Usage : engine/source01/build.sh sortie.mp4
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${1:-outputs/SOURCE01-tout-est-dispo.mp4}"
TMP="$(mktemp -d)"
[ -f engine/manif01/tex/paper.png ] || python3 engine/manif01/make_textures.py
python3 engine/source01/shoot_tiles.py
python3 engine/source01/audio.py "$TMP/raw.wav"
J=$(ffmpeg -hide_banner -i "$TMP/raw.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r II ITP ILRA ITH OFS <<< "$(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/raw.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFS:linear=true,aresample=48000,alimiter=limit=0.56:attack=0.3:release=80:level=disabled" "$TMP/final.wav"
python3 engine/render.py --html engine/source01/scene.html --cpu --sub 3 --crf 20 --vf "noise=c0s=6:c0f=t+u:c1s=3:c2s=3" --out "$TMP/v.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/v.mp4" -i "$TMP/final.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -t 18.8 "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | head -2
rm -rf "$TMP"
