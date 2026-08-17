#!/usr/bin/env bash
# fetch-audio.sh — download every raw CC0 / public-domain audio source into a
# staging directory. Nothing here is committed; tools/build-audio.sh trims and
# encodes the selected clips into assets/audio/.
#
# Every source below was licence-checked with tools/oga.py / tools/commons.py.
# CC-BY, CC-BY-SA and OGA-BY submissions were rejected: this repo redistributes
# the files verbatim, so only CC0 and public domain qualify.
set -euo pipefail

STAGE="${1:?usage: fetch-audio.sh <staging-dir>}"
mkdir -p "$STAGE/raw" "$STAGE/unpacked"
cd "$STAGE/raw"

UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
# upload.wikimedia.org rejects spoofed browser UAs for direct file fetches and
# serves an HTML error page instead, so Commons gets a descriptive one.
UA_WM='chronicle-game-assetbot/1.0 (public-domain audio vendoring) curl'

grab() { # grab <url> <outfile> [user-agent]
  if [ -s "$2" ]; then echo "  cached  $2"; return; fi
  curl -sSL -m 180 -A "${3:-$UA}" -o "$2" "$1"
  # Reject HTML error pages masquerading as audio.
  if file -b "$2" | grep -qi html; then
    echo "  FAIL    $2 (got HTML, not audio)" >&2
    rm -f "$2"
    return 1
  fi
  echo "  ok      $2 ($(du -h "$2" | cut -f1))"
}

echo "OpenGameArt — CC0 only"
OGA=https://opengameart.org/sites/default/files
for i in 1 2 3 4 5 6 7 8; do
  grab "$OGA/typewriter$i.wav" "oga_typewriter$i.wav"          # cassie-orbitgames, CC0
done
for n in "paper_sound_-_1" "paper_sound_-_2" "paper_sound_-_3" "paper_sound_-_4" \
         "paper_crushed_-_1" "paper_ripped_-_1"; do
  grab "$OGA/$n.mp3" "oga_${n//-/}.mp3"                        # luckius, CC0
done
grab "$OGA/snd_use_map.wav"   "oga_map_open.wav"               # spring-spring, CC0
grab "$OGA/snd_close_map.wav" "oga_map_close.wav"              # spring-spring, CC0
grab "$OGA/book_flips_-_starninjas.zip" "oga_bookflips.zip"    # starninjas, CC0
grab "$OGA/100-CC0-SFX_0.zip"           "oga_100sfx.zip"       # rubberduck, CC0
grab "$OGA/Contemplation.mp3"           "noir_contemplation.mp3" # joth, CC0 (theme)
grab "$OGA/4_music_box_tracks_ogg.zip"  "oga_musicbox.zip"     # aureolusomicron, CC0

grab_wm() { grab "$1" "$2" "$UA_WM"; }
echo "Wikimedia Commons — CC0 / public domain"
WM=https://upload.wikimedia.org/wikipedia/commons
grab_wm "$WM/9/9f/406243_stubb_typewriter-ding-near-mono.wav" "wm_typewriter_ding.wav"   # _stubb, CC0
grab_wm "$WM/6/6b/Turning_a_page.ogg"                         "wm_page_turn.ogg"        # planish, PD
grab_wm "$WM/b/b2/Bell-ring.flac"                             "wm_bell.flac"            # qubodup, CC0
grab_wm "$WM/a/a3/Watch_tick.ogg"                             "wm_watch_tick.ogg"       # Marble Toast, CC0
grab_wm "$WM/4/4f/Synthetic_bell_sound.ogg"                   "wm_bell_synth.ogg"       # Achim55, CC0
grab_wm "$WM/0/01/415061_gsb1039_clock-chime-tubebells-handbells-vibes.wav" "wm_chime.wav" # gsb1039, CC0

echo "Unpacking archives"
cd "$STAGE/unpacked"
for z in "$STAGE"/raw/*.zip; do
  d="$(basename "$z" .zip)"
  mkdir -p "$d"
  unzip -oqq "$z" -d "$d" 2>/dev/null || echo "  !! failed to unzip $z"
done

echo
echo "Staged in $STAGE"
find "$STAGE" -type f \( -name '*.wav' -o -name '*.ogg' -o -name '*.mp3' -o -name '*.flac' \) | wc -l | xargs echo "audio files:"
