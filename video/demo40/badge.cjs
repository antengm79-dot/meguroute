const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 260, height: 70 } });
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@900&family=Zen+Kaku+Gothic+New:wght@700&display=swap" rel="stylesheet">
  <style>body{margin:0;background:transparent}
  .b{display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 20px 0 16px;margin:9px;border-radius:26px;background:#08078F;border:3px solid #fff;box-shadow:0 6px 16px rgba(8,7,143,.35);color:#A1F9A1;font-family:'Zen Kaku Gothic New';font-weight:700;font-size:22px}
  .b span{font-family:Unbounded;font-weight:900;font-size:20px;letter-spacing:-2px}</style></head>
  <body><div class="b" id="b"><span>▶▶</span>倍速</div></body></html>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$('#b'); const bb = await el.boundingBox();
  await p.screenshot({ path: __dirname + '/badge.png', omitBackground: true, clip: { x: bb.x - 9, y: bb.y - 9, width: bb.width + 18, height: bb.height + 18 } });
  await b.close();
})();
