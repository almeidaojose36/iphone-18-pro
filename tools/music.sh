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
BASE="Instrumental only, no vocals, no spoken words. Underscore for a cinematic product film shot in a black void, mixed to sit under narration: no sudden loud hits, no busy lead melody."
gen a_open 215000 "Dark, minimal, premium electronic. Opens almost silent with a deep sub drone and a single soft pulse, then a restrained, precise synth pulse and muted low percussion enter, with slow glassy swells. Tense, elegant, curious. 88 BPM, E minor. $BASE"
gen b_inside 230000 "Steady, precise mid-tempo electronic groove. Muted plucked synth ostinato, soft kick, brushed hi-hats, round warm bass and light glassy bell accents. Methodical, like careful work on a fine mechanism, quietly optimistic. 92 BPM, A minor. $BASE"
gen c_deep 215000 "Deep, awe-filled cinematic electronic. Slow shimmering textures, wide sub bass, a patient rising chord progression and soft pulses, as if looking closely at something microscopic and beautiful. Subtle strings. 86 BPM, C minor. $BASE"
gen d_close 150000 "Resolved, warm cinematic electronic finale. Soft strings and synth pads over a steady hopeful pulse, a gentle piano motif, a gradual lift to a confident conclusion and a soft ending. 90 BPM, D major. $BASE"
