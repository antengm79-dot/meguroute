# 40秒デモ動画

1. `node rec.cjs` … 公開中のアプリ（GitHub Pages）をスマホサイズで自動操作して録画（`rec/` に webm と区切りの秒数 `marks.json`）。カメラには `cup.svg` から作った映像（`cup.y4m`）を使う
   - `cup.y4m` の作り方：`cup.svg` を720×1280のPNGにして `ffmpeg -loop 1 -i cup.png -t 4 -r 15 -vf format=yuv420p cup.y4m`
2. `node bg.cjs . ../../app/public/logo.png` … 場面ごとの背景（計画・記録・共有の見出し）を作る
3. `python3 ../edit.py rec/up.mp4 segs.json out.mp4 .` … `segs.json` の区間・速さで約40秒の16:9動画に編集（`up.mp4` は録画を780×1688に拡大したもの）
