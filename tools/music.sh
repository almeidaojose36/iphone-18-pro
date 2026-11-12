#!/bin/bash
# Generate the music bed with ElevenLabs Music. Usage: tools/music.sh  (needs ELEVENLABS_API_KEY, or a proxy that injects it)
set -u
cd "$(dirname "$0")/.."
mkdir -p audio/music
gen() { # name length_ms prompt
  [ -s "audio/music/$1.mp3" ] && return
  curl -sS -m 900 -X POST "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192" -H "Content-Type: application/json" -H "xi-api-key: ${ELEVENLABS_API_KEY:-proxy}" \
    -d "{\"prompt\":\"$3\",\"music_length_ms\":$2}" -o "audio/music/$1.mp3" -w "$1 %{http_code} %{size_download}\n"
}
gen bed 262000 "Instrumental only, no vocals, no spoken words. Dark, minimal, premium electronic underscore for a cinematic product film shot in a black void. Opens almost silent with a deep sub drone and a single soft pulse, then a restrained, precise synth pulse and muted low percussion enter, with slow glassy swells and airy textures. Tense and elegant, patient build, a wider and warmer lift in the final minute, then a soft resolved ending. Mixed to sit under narration: no sudden loud hits, no busy lead melody. 88 BPM, E minor."
