#!/bin/bash
# Contact sheet of the JPEGs in a folder, in name order: tools/sheet.sh [dir] [columns] [rows]  → <dir>/sheet-N.jpg
D=${1:-out/review}; C=${2:-4}; R=${3:-3}
rm -f "$D"/sheet-*.jpg
ls "$D"/*.jpg | sort -V | sed "s|^|file '$PWD/|; s|$|'|" > "$D/list.txt"
ffmpeg -y -v error -f concat -safe 0 -r 1 -i "$D/list.txt" -vf "scale=800:-1,tile=${C}x${R}" -q:v 3 "$D/sheet-%d.jpg" && ls "$D"/sheet-*.jpg
