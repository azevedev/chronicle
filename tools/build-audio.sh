#!/usr/bin/env bash
# build-audio.sh — trim, normalise and encode the staged CC0 sources into the
# small set of clips the game actually loads (assets/audio/).
#
#   ./tools/fetch-audio.sh <staging>     # download raw sources
#   ./tools/build-audio.sh <staging>     # -> assets/audio/*.ogg + *.mp3
#
# Every clip ships in both Vorbis and MP3: Vorbis is smaller and loops without
# encoder padding, MP3 covers Safari. js/audio.js picks one at runtime.
set -euo pipefail

STAGE="${1:?usage: build-audio.sh <staging-dir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/audio"
RAW="$STAGE/raw"
UNP="$STAGE/unpacked"
mkdir -p "$OUT"

# Peak-normalise: measure with volumedetect, then apply the gain that lands the
# loudest sample at the target. Safer than loudnorm on sub-second one-shots.
peak_gain() { # peak_gain <file> <target_dbfs> -> gain in dB
  local max
  max=$(ffmpeg -hide_banner -nostats -i "$1" -af volumedetect -f null /dev/null 2>&1 \
        | sed -n 's/.*max_volume: \(-\?[0-9.]*\) dB.*/\1/p' | head -1)
  [ -z "$max" ] && max=0
  python3 -c "print(round($2 - ($max), 2))"
}

# sfx <out-name> <src> <target_db> [extra ffmpeg audio filters]
sfx() {
  local name="$1" src="$2" tgt="$3" extra="${4:-}"
  if [ ! -f "$src" ]; then echo "  MISSING $src" >&2; return 1; fi
  local g; g=$(peak_gain "$src" "$tgt")
  # Strip leading silence so every one-shot fires on the same frame, then
  # apply the measured gain and a 15 ms tail fade to kill encoder clicks.
  local chain="silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.005,volume=${g}dB${extra:+,$extra}"
  ffmpeg -y -v error -i "$src" -af "$chain" -ac 1 -ar 32000 -c:a libvorbis -q:a 1 "$OUT/$name.ogg"
  ffmpeg -y -v error -i "$src" -af "$chain" -ac 1 -ar 32000 -c:a libmp3lame -b:a 80k "$OUT/$name.mp3"
  printf "  %-14s %5s KB ogg / %5s KB mp3   (gain %+.1f dB)\n" "$name" \
    "$(( $(stat -c%s "$OUT/$name.ogg") / 1024 ))" \
    "$(( $(stat -c%s "$OUT/$name.mp3") / 1024 ))" "$g"
}

echo "Sound effects -> $OUT"

# --- typing & submission -------------------------------------------------
sfx key1    "$RAW/oga_typewriter7.wav"       -14 "atrim=0:0.22"
sfx key2    "$RAW/oga_typewriter6.wav"       -14 "atrim=0:0.24"
sfx key3    "$RAW/oga_typewriter8.wav"       -14 "atrim=0:0.24"
sfx ding    "$RAW/wm_typewriter_ding.wav"     -9

# --- verdicts ------------------------------------------------------------
sfx correct "$RAW/wm_bell.flac"               -8
sfx wrong   "$UNP/oga_100sfx/slam_03.ogg"     -9
sfx stamp   "$UNP/oga_100sfx/slam_01.ogg"     -7
sfx gong    "$UNP/oga_100sfx/gong_01.ogg"     -9
sfx chime   "$UNP/oga_100sfx/bell_02.ogg"    -11

# --- paper & navigation --------------------------------------------------
sfx hint     "$UNP/oga_bookflips/book_flip.5.ogg" -12
sfx page     "$RAW/wm_page_turn.ogg"             -11 "atrim=0:1.4"
sfx rustle   "$RAW/oga_paper_sound__2.mp3"       -16
sfx crumple  "$RAW/oga_paper_crushed__1.mp3"     -11
sfx unfurl   "$RAW/oga_map_open.wav"             -12
sfx pin      "$UNP/oga_100sfx/wooden_01.ogg"     -13
sfx tick     "$RAW/wm_watch_tick.ogg"            -20

# --- music bed -----------------------------------------------------------
# Kept full-length and lazily loaded (only fetched once the player enables
# sound), so it never blocks first paint.
echo "Music -> $OUT"
MUSIC="$UNP/oga_musicbox/musicbox1_spooky_waltz.ogg"
ffmpeg -y -v error -i "$MUSIC" -af "loudnorm=I=-23:TP=-2:LRA=11" -ac 2 -ar 44100 \
  -c:a libvorbis -q:a 1 "$OUT/theme.ogg"
ffmpeg -y -v error -i "$MUSIC" -af "loudnorm=I=-23:TP=-2:LRA=11" -ac 2 -ar 44100 \
  -c:a libmp3lame -b:a 96k "$OUT/theme.mp3"
printf "  %-14s %5s KB ogg / %5s KB mp3\n" "theme" \
  "$(( $(stat -c%s "$OUT/theme.ogg") / 1024 ))" \
  "$(( $(stat -c%s "$OUT/theme.mp3") / 1024 ))"

echo
echo "Total: $(du -sh "$OUT" | cut -f1) in $(ls "$OUT" | wc -l) files"
