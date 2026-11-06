"""Edit a phone screen recording into a 16:9 slide video.

usage: python3 edit.py <recording> <segments.json> <out.mp4> [assets_dir]
segments.json: [[start_sec, end_sec, speed, step_index], ...]
"""
import json
import os
import subprocess
import sys
import tempfile

FF = "/usr/bin/ffmpeg"
PX, PY, PW, PH = 734, 50, 452, 980
FPS = 30

src, segs_file, out = sys.argv[1], sys.argv[2], sys.argv[3]
assets = sys.argv[4] if len(sys.argv) > 4 else os.path.dirname(os.path.abspath(__file__))
segs = json.load(open(segs_file))
tmp = tempfile.mkdtemp(dir=os.path.dirname(os.path.abspath(out)))
parts = []
for i, seg in enumerate(segs):
    a, b, speed, step = seg[:4]
    badge = len(seg) > 4 and seg[4]
    dur = (b - a) / speed
    part = os.path.join(tmp, f"p{i:02d}.mp4")
    fc = (
        f"[1:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{speed},fps={FPS},"
        f"scale={PW}:{PH}:force_original_aspect_ratio=increase,crop={PW}:{PH},format=rgba[ph];"
        f"[2:v]format=gray,scale={PW}:{PH}[m];[ph][m]alphamerge[phm];"
        f"[0:v][phm]overlay={PX}:{PY}:shortest=1" + ("[c];[3:v]format=rgba[bd];[c][bd]overlay={}:{}".format(78, 700) if badge else "") + ",format=yuv420p[v]"
    )
    subprocess.run(
        [FF, "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}",
         "-i", os.path.join(assets, f"bg{step}.png"), "-i", src, "-loop", "1", "-i", os.path.join(assets, "mask.png"), *(["-loop", "1", "-i", os.path.join(assets, "badge.png")] if badge else []),
         "-filter_complex", fc, "-map", "[v]", "-t", f"{dur:.3f}", "-r", str(FPS),
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-an", part],
        check=True,
    )
    parts.append(part)

lst = os.path.join(tmp, "list.txt")
with open(lst, "w") as f:
    f.writelines(f"file '{p}'\n" for p in parts)
subprocess.run([FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out], check=True)
total = sum((s[1] - s[0]) / s[2] for s in segs)
print(f"wrote {out} ({total:.1f}s)")
