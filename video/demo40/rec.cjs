// Record the 40s demo flow on the live GitHub Pages app (real OSM map), with tap indicators.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/rec';
const U = 'https://antengm79-dot.github.io/meguroute/#';
(async () => {
  const b = await chromium.launch({
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${__dirname}/cup.y4m`],
  });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: false, permissions: ['camera'], recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  await ctx.addInitScript(() => {
    addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:22px;background:rgba(161,249,161,.55);border:3px solid rgba(8,7,143,.55);z-index:99999;pointer-events:none;transition:transform .45s,opacity .45s`;
      document.documentElement.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = 'scale(1.6)'; d.style.opacity = '0'; });
      setTimeout(() => d.remove(), 600);
    }, true);
  });
  const p = await ctx.newPage();
  const t0 = Date.now();
  const marks = [];
  const mark = (k) => { marks.push([k, +((Date.now() - t0) / 1000).toFixed(2)]); };
  const w = (ms) => p.waitForTimeout(ms);
  const tap = (sel) => p.click(sel);
  try {
    await p.goto(U + '/'); await w(9000); mark('home');
    await w(1200); await tap('text=ルートを決めてから出かける'); await w(1000); mark('plan');
    await tap('text=エリアをえらぶ'); await w(700); await tap('.chip:has-text("梅田")'); await w(600);
    await p.evaluate(() => document.querySelector('.screen').scrollTo({ top: 260, behavior: 'smooth' })); await w(700);
    await tap('text=経由地を追加'); await w(700); await tap('.sheet >> text=カフェ'); await w(600);
    await tap('text=経由地を追加'); await w(700); await tap('.sheet >> text=公園'); await w(700);
    await tap('text=検索'); await w(900); mark('question');
    await tap('text=おしゃれ'); await w(800); await tap('text=コーヒー・紅茶'); await w(800);
    await tap('text=スキップ'); await w(1500); mark('results');
    const secs = await p.$$('section');
    for (const s of secs) { const btn = await s.$('.hscroll button'); if (btn) { await btn.click(); await w(1300); await tap('.sheet >> text=ここにする'); await w(500); } }
    await tap('text=決定してルートを作る'); await w(400); mark('route'); await w(5000);
    await tap('text=旅をスタート'); await w(200); mark('trip');
    let n = 0;
    for (let i = 0; i < 160 && n < 2; i++) {
      await w(250);
      if (await p.$('text=写真を撮りますか？')) {
        n++;
        if (n === 1) {
          await w(700); mark('arrive');
          await tap('.modal >> text=撮影する'); await w(2600); mark('camera');
          await tap('[aria-label="シャッター"]'); await w(700); await tap('[aria-label="シャッター"]'); await w(700);
          await tap('text=完了して旅にもどる'); await w(300); mark('trip2');
        } else { await w(500); await tap('text=ここではとらない'); }
      }
    }
    for (let i = 0; i < 40; i++) { await w(250); if ((await p.textContent('body')).includes('ゴール')) break; }
    await w(800); mark('goal');
    await tap('text=旅を終了'); mark('end'); await w(5500);
    await tap('text=10秒Vlogをつくる'); await w(500); mark('vlog'); await w(4500);
    await tap('text=ルートを公開する'); await w(1000); mark('publish');
    await tap('text=公開する'); await w(1500);
    await tap('text=みんなのルートを見る'); await w(1500); mark('feed');
    await tap('article >> nth=0 >> button:has-text("0")'); await w(1500);
    await p.evaluate(() => document.querySelector('.screen').scrollTo({ top: 520, behavior: 'smooth' })); await w(1500);
    await tap('text=マイページ'); await w(1200); mark('me');
    await p.evaluate(() => document.querySelector('.screen').scrollTo({ top: 430, behavior: 'smooth' })); await w(2500);
    mark('done');
  } catch (e) { console.log('SCRIPT', e.message.slice(0, 300)); }
  await ctx.close();
  fs.writeFileSync(OUT + '/marks.json', JSON.stringify(marks));
  console.log(JSON.stringify(marks));
  await b.close();
})();
