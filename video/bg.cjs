// Render the 16:9 slide backgrounds (one per step) with the phone slot left empty.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const LOGO = 'data:image/png;base64,' + fs.readFileSync(process.argv[3]).toString('base64');
const STEPS = [
  ['選ぶ', '行きたいところを選ぶと、\nAIがルートを作成'],
  ['出発', '「旅をスタート」で記録開始。\n歩いた道が色づく'],
  ['撮影', 'スポットに着いたら、\nその場で撮影'],
  ['ふり返り', '旅を終了すると、\n歩いたルートが描かれる'],
  ['Vlog', '写真を選ぶだけで\n約10秒のVlogに'],
  ['共有', 'ルートを公開。\nみんなが見て、いいね・なぞる'],
];
// phone slot (must match edit.sh)
const PX = 734, PY = 50, PW = 452, PH = 980;

const html = (i) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Unbounded:wght@900&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:'Zen Kaku Gothic New',sans-serif;color:#12133A;
background:#fff;background-image:linear-gradient(rgba(8,7,143,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(8,7,143,.07) 1px,transparent 1px);background-size:18px 18px;position:relative}
.logo{position:absolute;left:72px;top:56px;height:64px}
.left{position:absolute;left:90px;top:330px;width:560px}
.num{width:120px;height:120px;border-radius:60px;background:#08078F;color:#A1F9A1;font-family:Unbounded;font-weight:900;font-size:56px;display:flex;align-items:center;justify-content:center}
.ttl{font-family:'Dela Gothic One';font-size:84px;color:#08078F;margin:28px 0 18px;line-height:1.1}
.sub{font-size:34px;font-weight:700;line-height:1.6;white-space:pre-line}
.frame{position:absolute;left:${PX - 12}px;top:${PY - 12}px;width:${PW + 24}px;height:${PH + 24}px;border-radius:64px;background:#12133A;box-shadow:0 30px 70px rgba(8,7,143,.28)}
.list{position:absolute;right:90px;top:250px;display:flex;flex-direction:column;gap:22px}
.it{display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700;color:rgba(18,19,58,.35)}
.it b{width:58px;height:58px;border-radius:29px;border:3px solid rgba(8,7,143,.25);display:flex;align-items:center;justify-content:center;font-family:Unbounded;font-size:22px;color:rgba(8,7,143,.4)}
.it.on{color:#08078F}.it.on b{background:#A1F9A1;border-color:#08078F;color:#08078F}
.it.done{color:rgba(18,19,58,.6)}.it.done b{background:#08078F;border-color:#08078F;color:#A1F9A1}
.en{position:absolute;left:90px;bottom:70px;font-family:Unbounded;font-weight:900;font-size:22px;letter-spacing:.16em;color:#08078F}
</style></head><body>
<img class="logo" src="${LOGO}">
<div class="left"><div class="num">${i + 1}</div><div class="ttl">${STEPS[i][0]}</div><div class="sub">${STEPS[i][1]}</div></div>
<div class="frame"></div>
<div class="list">${STEPS.map((s, j) => `<div class="it ${j === i ? 'on' : j < i ? 'done' : ''}"><b>${j + 1}</b>${s[0]}</div>`).join('')}</div>
<div class="en">PLAN · WALK · SHARE</div>
</body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (let i = 0; i < STEPS.length; i++) {
    await p.setContent(html(i), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, `bg${i}.png`) });
  }
  // rounded mask for the phone video
  await p.setViewportSize({ width: PW, height: PH });
  await p.setContent(`<body style="margin:0;background:#000"><div style="width:${PW}px;height:${PH}px;border-radius:52px;background:#fff"></div></body>`);
  await p.screenshot({ path: path.join(OUT, 'mask.png') });
  await b.close();
})();
