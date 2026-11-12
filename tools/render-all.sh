#!/bin/bash
# Render the whole picture in resumable chunks (out/chunks/cNNN.mp4). Re-run to continue; finished chunks are skipped.
# Settings come from the environment (defaults in brackets):
#   WIDTH [1920] HEIGHT [1080] FPS [30] SCALE [1] QUALITY [high] CRF [14] LEN [20 s per chunk]
#   GPU [1 = use the graphics card, 0 = software]  HEADED [0; 1 shows the browser window]
#   WORKERS [1] parallel render processes (useful for software rendering on a many-core machine)
# Examples:  tools/render-all.sh                         # 1080p30 on the GPU
#            WIDTH=3840 HEIGHT=2160 tools/render-all.sh   # 4K
#            GPU=0 WIDTH=1280 HEIGHT=720 FPS=24 WORKERS=3 tools/render-all.sh   # CPU-only fallback
# Changing any setting? Delete out/chunks first so old and new chunks are not mixed.
cd "$(dirname "$0")/.."
WIDTH=${WIDTH:-1920}; HEIGHT=${HEIGHT:-1080}; FPS=${FPS:-30}; SCALE=${SCALE:-1}; QUALITY=${QUALITY:-high}; CRF=${CRF:-14}
LEN=${LEN:-20}; GPU=${GPU:-1}; HEADED=${HEADED:-0}; WORKERS=${WORKERS:-1}
FLAGS=(); [ "$GPU" = 1 ] && FLAGS+=(--gpu); [ "$HEADED" = 1 ] && FLAGS+=(--headed)
TOTAL=$(node -e "import('./content/timing.js').then(m=>console.log(Math.ceil(m.TIMING.total)))")
mkdir -p out/chunks
echo "$WIDTH x $HEIGHT @ $FPS fps, scale $SCALE, quality $QUALITY" > out/chunks/settings.txt
worker() { # worker index: takes every WORKERS-th chunk
  local i=0
  for ((t=0; t<TOTAL; t+=LEN)); do
    local f; f=$(printf "out/chunks/c%03d.mp4" $i); local mine=$(( i % WORKERS )); i=$((i+1))
    [ "$mine" = "$1" ] || continue
    [ -s "$f" ] && continue
    local to=$((t+LEN)); [ $to -gt $TOTAL ] && to=$TOTAL
    node tools/render-video.mjs --width $WIDTH --height $HEIGHT --from $t --to $to --fps $FPS --scale $SCALE --quality $QUALITY --crf $CRF "${FLAGS[@]}" --out "$f.part.mp4" > "out/chunks/w$1.log" 2>&1 \
      && mv "$f.part.mp4" "$f" || { echo "chunk $f failed (see out/chunks/w$1.log)"; return 1; }
    echo "done $f"
  done
}
for ((w=0; w<WORKERS; w++)); do worker $w & done
wait
echo "finished: $(ls out/chunks/c[0-9]*.mp4 2>/dev/null | grep -vc part) chunks"
