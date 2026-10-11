# python3 compose.py en  -> /tmp/promo/out/<lang>/ai-window-deck-promo-<lang>.mp4
import json, subprocess, sys

lang = sys.argv[1] if len(sys.argv) > 1 else "en"
d = f"/tmp/promo/out/{lang}"
cards = f"/tmp/promo/cards/{lang}"
m = json.load(open(f"{d}/marks.json"))

START = max(0.0, m["c1"] - 0.6)
END = m["end"]
INTRO, OUTRO, XF = 3.0, 4.5, 0.5
main_len = END - START

caps = [
    ("c1", m["c1"], m["c2"]), ("c2", m["c2"], m["c3"]), ("c3", m["c3"], m["c4"]),
    ("c4", m["c4"], m["c5"]), ("c5", m["x1"] - 0.3, m["c6"]), ("c6", m["c6"], m["c5b"]),
    ("c5", m["c5b"] + 1.0, m["c6b"]), ("c6", m["c6b"], END),
]

args = ["ffmpeg", "-v", "error", "-y",
        "-loop", "1", "-t", str(INTRO), "-framerate", "30", "-i", f"{cards}/intro.png",
        "-ss", f"{START:.3f}", "-t", f"{main_len:.3f}", "-i", f"{d}/raw.mp4",
        "-loop", "1", "-t", str(OUTRO), "-framerate", "30", "-i", f"{cards}/outro.png"]
for cid, a, b in caps:
    args += ["-loop", "1", "-t", f"{b - a:.3f}", "-framerate", "30", "-i", f"{cards}/{cid}.png"]

f = ["[0:v]format=yuv420p,setsar=1[intro]", "[2:v]format=yuv420p,setsar=1[outro]", "[1:v]setpts=PTS-STARTPTS,fps=30,setsar=1[m0]"]
last = "m0"
for i, (cid, a, b) in enumerate(caps):
    dur, st = b - a, a - START
    f.append(f"[{i + 3}:v]format=rgba,fade=in:st=0:d=0.25:alpha=1,fade=out:st={dur - 0.25:.3f}:d=0.25:alpha=1,setpts=PTS-STARTPTS+{st:.3f}/TB[k{i}]")
    f.append(f"[{last}][k{i}]overlay=0:0:eof_action=pass[m{i + 1}]")
    last = f"m{i + 1}"
f.append(f"[{last}]format=yuv420p[main]")
f.append(f"[intro][main]xfade=transition=fade:duration={XF}:offset={INTRO - XF}[a1]")
f.append(f"[a1][outro]xfade=transition=fade:duration={XF}:offset={INTRO - XF + main_len - XF:.3f}[v]")

total = INTRO + main_len + OUTRO - 2 * XF
out = f"{d}/ai-window-deck-promo-{lang}.mp4"
args += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "anullsrc=r=48000:cl=stereo",
         "-filter_complex", ";".join(f), "-map", "[v]", "-map", f"{len(caps) + 3}:a",
         "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
         "-c:a", "aac", "-b:a", "64k", "-shortest", "-movflags", "+faststart", out]
subprocess.run(args, check=True)
print(out, f"{total:.1f}s")
