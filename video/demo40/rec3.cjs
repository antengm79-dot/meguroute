// 40秒デモの録画（v3）：各スポットで、動画をカメラ映像として流して撮影し、写真をライブラリから追加する
// usage: node rec3.cjs <cafe.webm> <cafe.jpg> <park.webm> <park.jpg>
//   SHOTS=1 のときは録画せず、スライド用に3倍の解像度でスクリーンショットを撮る
const { chromium } = require('playwright');
const fs = require('fs');
const SHOTS = !!process.env.SHOTS;
const OUT = __dirname + (SHOTS ? '/slideshots3' : '/rec3');
fs.mkdirSync(OUT, { recursive: true });
const U = 'https://antengm79-dot.github.io/meguroute/#';
const b64 = (f, type) => `data:${type};base64,` + fs.readFileSync(f).toString('base64');
const SPOTS = [
  { video: b64(process.argv[2], 'video/webm'), photo: process.argv[3] },
  { video: b64(process.argv[4], 'video/webm'), photo: process.argv[5] },
];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(
    SHOTS
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 }
      : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } },
  );
  await ctx.addInitScript(() => {
    // tap indicator
    addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:22px;background:rgba(161,249,161,.55);border:3px solid rgba(8,7,143,.55);z-index:99999;pointer-events:none;transition:transform .45s,opacity .45s`;
      document.documentElement.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = 'scale(1.6)'; d.style.opacity = '0'; });
      setTimeout(() => d.remove(), 600);
    }, true);
    // camera: play the clip set in window.__camVideo as the live camera image
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => {
        const c = document.createElement('canvas');
        c.width = 720; c.height = 1280;
        const g = c.getContext('2d');
        const v = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.src = window.__camVideo || '';
        await v.play().catch(() => {});
        const draw = () => {
          g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
          if (v.videoWidth) {
            const ir = v.videoWidth / v.videoHeight, cr = c.width / c.height;
            let w = c.width, h = c.height;
            if (ir > cr) w = h * ir; else h = w / ir;
            g.drawImage(v, (c.width - w) / 2, (c.height - h) / 2, w, h);
          }
          requestAnimationFrame(draw);
        };
        draw();
        return c.captureStream(30);
      };
    }
  });
  const p = await ctx.newPage();
  const t0 = Date.now();
  const marks = [];
  const mark = (k) => marks.push([k, +((Date.now() - t0) / 1000).toFixed(2)]);
  const shot = (n) => SHOTS && p.screenshot({ path: `${OUT}/${n}.png` });
  const w = (ms) => p.waitForTimeout(ms);
  const tap = (sel) => p.click(sel);
  const scroll = (y) => p.evaluate((y) => document.querySelector('.screen').scrollTo({ top: y, behavior: 'smooth' }), y);
  try {
    await p.goto(U + '/'); await w(9000); mark('home');
    await w(1000); await tap('text=ルートを決めてから出かける'); await w(1000); mark('plan');
    await tap('text=エリアをえらぶ'); await w(600); await tap('.chip:has-text("梅田")'); await w(500);
    await scroll(300); await w(700);
    await tap('input[placeholder="現在地から出発"]'); await w(300); mark('typeStart');
    await p.keyboard.type('なかもず', { delay: 260 }); await w(700);
    await tap('.card button:has-text("中百舌鳥駅")'); await w(600);
    await tap('text=経由地を追加'); await w(700); await tap('.sheet >> text=カフェ'); await w(600);
    await tap('text=経由地を追加'); await w(700); await tap('.sheet >> text=公園'); await w(600);
    await scroll(560); await w(700);
    await tap('input[placeholder="最後のスポットで終了"]'); await w(300); mark('typeEnd');
    await p.keyboard.type('きたはま', { delay: 260 }); await w(700);
    await tap('.card button:has-text("北浜駅")'); await w(700);
    await tap('text=検索'); await w(900); mark('question');
    await tap('text=おしゃれ'); await w(800); await tap('text=コーヒー・紅茶'); await w(800);
    await tap('text=スキップ'); await w(1500); mark('results');
    const want = ['喫茶ミナモ', 'うめきた公園'];
    const secs = await p.$$('section');
    for (let i = 0; i < secs.length; i++) {
      const btn = (await secs[i].$(`.hscroll button:has-text("${want[i]}")`)) || (await secs[i].$('.hscroll button'));
      if (btn) { await btn.scrollIntoViewIfNeeded(); await w(300); await btn.click(); await w(1300); await tap('.sheet >> text=ここにする'); await w(500); }
    }
    await tap('text=決定してルートを作る'); await w(400); mark('route'); await w(SHOTS ? 14000 : 5500); await shot('route');
    await tap('text=旅をスタート'); await w(200); mark('trip');
    let n = 0;
    for (let i = 0; i < 200 && n < 2; i++) {
      await w(250);
      if (await p.$('text=写真を撮りますか？')) {
        const s = SPOTS[n];
        await p.evaluate((src) => { window.__camVideo = src; }, s.video);
        n++;
        await w(700); mark('arrive' + n);
        await tap('.modal >> text=撮影する'); await w(1900); mark('camera' + n); await shot('camera' + n);
        await tap('[aria-label="シャッター"]'); await w(900);
        const [fc] = await Promise.all([p.waitForEvent('filechooser'), tap('[aria-label="ライブラリから追加"]')]);
        await fc.setFiles(s.photo); await w(1300); mark('lib' + n);
        await tap('text=完了して旅にもどる'); await w(300); mark('back' + n);
      }
    }
    for (let i = 0; i < 60; i++) { await w(250); if ((await p.textContent('body')).includes('ゴール')) break; }
    await w(800); mark('goal');
    await tap('text=旅を終了'); mark('end'); await w(SHOTS ? 12000 : 5500); await shot('end');
    await tap('text=10秒Vlogをつくる'); await w(500); mark('vlog'); await w(3000);
    await tap('button:has-text("ピンク")'); await w(1300); await shot('vlog'); await w(700);
    await scroll(400); await w(900);
    await tap('text=ルートを公開する'); await w(900); mark('publish');
    await tap('.seg >> text=全体'); await w(700);
    await tap('text=公開する'); await w(1600); mark('published');
    await tap('text=みんなのルートを見る'); await w(1200); mark('feed');
    await tap('article >> nth=0 >> button:has-text("0")'); await w(1500); await shot('feed');
    await scroll(420); await w(1500);
    await tap('text=マイページ'); await w(1000); mark('me');
    await scroll(430); await w(2600); await shot('me');
    mark('done');
  } catch (e) { console.log('SCRIPT', e.message.slice(0, 300)); }
  await ctx.close();
  fs.writeFileSync(OUT + '/marks.json', JSON.stringify(marks));
  console.log(JSON.stringify(marks));
  await b.close();
})();
