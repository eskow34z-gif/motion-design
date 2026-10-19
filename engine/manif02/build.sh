#!/usr/bin/env bash
# MANIF02 : calage sur la prise → tuiles → son (−14 LUFS) → rendu 1080×1920 30 i/s avec flou de bougé.
# Usage : engine/manif02/build.sh prise.mp3 sortie.mp4 [tempo]     (sans prise : engine/manif02/build.sh - sortie.mp4)
set -euo pipefail
cd "$(dirname "$0")/../.."
VO="$1"; OUT="$2"; TEMPO="${3:-1.0}"; TMP="$(mktemp -d)"
[ -f engine/manif01/tex/paper.png ] || python3 engine/manif01/make_textures.py
[ -f engine/manif02/clip/0001.jpg ] || ffmpeg -v error -y -i engine/manif02/src/clip.mp4 -vf "scale=900:1600:flags=lanczos,unsharp=5:5:0.6" -q:v 3 engine/manif02/clip/%04d.jpg
if [ "$VO" = "-" ]; then python3 engine/manif02/timing.py --nominal; python3 engine/manif02/audio.py "$TMP/raw.wav"
else python3 engine/manif02/timing.py "$VO" "$TMP/voice_fit.wav" --tempo "$TEMPO"
  ffmpeg -hide_banner -loglevel error -y -i "$TMP/voice_fit.wav" -af "highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2" "$TMP/voice.wav"
  python3 engine/manif02/audio.py "$TMP/raw.wav" --voice "$TMP/voice.wav"; fi
J=$(ffmpeg -hide_banner -i "$TMP/raw.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r II ITP ILRA ITH OFS <<< "$(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/raw.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFS:linear=true,aresample=48000,volume=0.8dB,alimiter=limit=0.56:attack=0.3:release=80:level=disabled" "$TMP/final.wav"
python3 engine/manif02/shoot_tiles.py
python3 engine/render.py --html engine/manif02/scene.html --cpu --sub "${SUB:-3}" --crf 20 --vf "noise=c0s=6:c0f=t+u:c1s=3:c2s=3" --out "$TMP/v.mp4"
D=$(python3 -c "import re,json;print(json.loads(re.search(r'window.TL = (.*);',open('engine/manif02/timing.js').read()).group(1))['dur'])")
ffmpeg -hide_banner -loglevel error -y -i "$TMP/v.mp4" -i "$TMP/final.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -t "$D" "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | head -2
cp "$TMP/final.wav" "${OUT%.mp4}.wav"
rm -rf "$TMP"
