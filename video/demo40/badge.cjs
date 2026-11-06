const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 120 } });
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@900&family=Zen+Kaku+Gothic+New:wght@700&display=swap" rel="stylesheet">
  <style>body{margin:0;background:transparent}
  .b{display:inline-flex;align-items:center;gap:10px;height:84px;padding:0 34px 0 26px;margin:14px;border-radius:42px;background:#A1F9A1;border:4px solid #08078F;box-shadow:0 10px 26px rgba(8,7,143,.3);color:#08078F;font-family:'Zen Kaku Gothic New';font-weight:700;font-size:38px;gap:14px}
  .b span{font-family:Unbounded;font-weight:900;font-size:34px;letter-spacing:-4px}</style></head>
  <body><div class="b" id="b"><span>▶▶</span>倍速</div></body></html>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$('#b'); const bb = await el.boundingBox();
  await p.screenshot({ path: __dirname + '/badge.png', omitBackground: true, clip: { x: bb.x - 14, y: bb.y - 14, width: bb.width + 28, height: bb.height + 28 } });
  await b.close();
})();
