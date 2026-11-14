#!/bin/bash
# Render the whole video in 20-second segments on several processes, then join them and add the voiceover.
# Safe to re-run: finished segments are kept, so an interrupted render resumes where it stopped.
#   tools/render-parallel.sh [width=1280] [fps=24] [jobs=4]   → out/deep-teardown-<height>p.mp4
cd "$(dirname "$0")/.." || exit 1
W=${1:-1280}; FPS=${2:-24}; JOBS=${3:-4}; SEG=20
H=$((W * 9 / 16)); DIR=out/seg-${H}p-${FPS}; mkdir -p "$DIR"
TOTAL=$(python3 -c "import json;print(json.load(open('audio/manifest.json'))['duration'])")
N=$(python3 -c "import math;print(math.ceil($TOTAL/$SEG))")
one() {
  local i=$1 f; f=$(printf "$DIR/%03d.mp4" "$i")
  [ -s "$f" ] && return 0
  node tools/render.mjs --width "$W" --fps "$FPS" --from $((i * SEG)) --to $(((i + 1) * SEG)) --noaudio --crf 20 --out "$f.part.mp4" >/dev/null 2>"$f.log" \
    && mv "$f.part.mp4" "$f" && rm -f "$f.log" && echo "segment $((i + 1))/$N done"
}
export -f one; export DIR W FPS SEG N
seq 0 $((N - 1)) | xargs -P "$JOBS" -I{} bash -c 'one {}'
for i in $(seq 0 $((N - 1))); do f=$(printf "$DIR/%03d.mp4" "$i"); [ -s "$f" ] || { echo "missing segment $i; re-run to resume"; exit 1; }; echo "file '$(basename "$f")'"; done > "$DIR/list.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$DIR/list.txt" -i audio/voiceover_full.mp3 -c:v copy -c:a aac -b:a 192k -shortest "out/deep-teardown-${H}p.mp4" \
  && echo "wrote out/deep-teardown-${H}p.mp4"
