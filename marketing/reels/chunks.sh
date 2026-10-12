#!/bin/sh
# usage: chunks.sh file.mp3  -> prints indexed speech chunks with durations
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
ffmpeg -hide_banner -i "$1" -af silencedetect=n=-35dB:d=0.25 -f null - 2>&1 | grep -oE "silence_(start|end): [0-9.]+" | awk -v D="$D" '
BEGIN{prev=0; n=0}
$1=="silence_start:"{ if($2-prev>0.15) printf "c%d [%.2f..%.2f] %.1fs\n", n++, prev, $2, $2-prev }
$1=="silence_end:"{ prev=$2 }
END{ if(D-prev>0.15) printf "c%d [%.2f..%.2f] %.1fs\n", n++, prev, D, D-prev }'
