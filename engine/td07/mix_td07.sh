#!/usr/bin/env bash
# TD07 : voix (décalée de 0,15 s, sans accélération) + bruitages discrets, −14 LUFS, puis multiplexage.
# Usage : engine/td07/mix_td07.sh voix.mp3 bruitages.wav video_muette.mp4 sortie.mp4 [gain_bruitages_dB]
# Gain des bruitages = -99 pour une version voix seule.
set -euo pipefail
VOICE="$1"; SFX="$2"; VIDEO="$3"; OUT="$4"; SFXDB="${5:--13}"
TMP="$(mktemp -d)"; DUR=22.6

ffmpeg -hide_banner -loglevel error -y -i "$VOICE" -ar 48000 -ac 2 \
  -af "highpass=f=70,adelay=150|150,apad,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2" \
  -t "$DUR" "$TMP/voice.wav"
if [ "$SFXDB" = "-99" ]; then cp "$TMP/voice.wav" "$TMP/mix.wav"; else
ffmpeg -hide_banner -loglevel error -y -i "$TMP/voice.wav" -i "$SFX" \
  -filter_complex "[1:a]volume=${SFXDB}dB,aresample=48000[s];[0:a][s]amix=inputs=2:duration=first:normalize=0[m]" \
  -map "[m]" -t "$DUR" "$TMP/mix.wav"; fi
J=$(ffmpeg -hide_banner -i "$TMP/mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r II ITP ILRA ITH OFS <<< "$(echo "$J" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/mix.wav" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$II:measured_TP=$ITP:measured_LRA=$ILRA:measured_thresh=$ITH:offset=$OFS:linear=true,aresample=48000" \
  "$TMP/final.wav"
ffmpeg -hide_banner -loglevel error -y -i "$VIDEO" -i "$TMP/final.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -t "$DUR" -movflags +faststart "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | head -2
rm -rf "$TMP"
