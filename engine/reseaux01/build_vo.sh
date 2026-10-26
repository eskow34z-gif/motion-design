#!/usr/bin/env bash
# RESEAUX01 : prise de voix calée au morceau de phrase + bruitages (sans musique) + sous-titres collés, −14 LUFS.
# Usage : engine/reseaux01/build_vo.sh prise.mp3 sortie.mp4 [carte.json] [tempo]
set -euo pipefail
cd "$(dirname "$0")/../.."
VO="$1"; OUT="$2"; MAP="${3:-}"; TP="${4:-1.15}"; TMP="$(mktemp -d)"
[ -f engine/reseaux01/tex/paper.png ] || python3 engine/reseaux01/make_textures.py
python3 engine/reseaux01/voice.py "$VO" "$TMP/voice_fit.wav" --tempo "$TP" ${MAP:+--map "$MAP"}
ffmpeg -hide_banner -loglevel error -y -i "$TMP/voice_fit.wav" -af "highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2" "$TMP/voice.wav"
python3 engine/reseaux01/audio.py "$TMP/raw.wav" --warp engine/reseaux01/warp.js --voice "$TMP/voice.wav"
J=$(ffmpeg -hide_banner -i "$TMP/raw.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r II ITP ILRA ITH OFS <<< "$(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/raw.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFS:linear=true,aresample=48000,volume=0.8dB,alimiter=limit=0.56:attack=0.3:release=80:level=disabled" "$TMP/final.wav"
python3 engine/reseaux01/shoot_tiles.py
python3 engine/render.py --html engine/reseaux01/scene_vo.html --cpu --sub 3 --crf 20 --vf "noise=c0s=7:c0f=t+u:c1s=3:c2s=3" --out "$TMP/v.mp4"
D=$(python3 -c "import re;print(re.search(r'VDUR = ([\d.]+)',open('engine/reseaux01/warp.js').read()).group(1))")
ffmpeg -hide_banner -loglevel error -y -i "$TMP/v.mp4" -i "$TMP/final.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -t "$D" "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | head -2
cp "$TMP/final.wav" "${OUT%.mp4}.wav"
rm -rf "$TMP"
