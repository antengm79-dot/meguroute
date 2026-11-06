// 40秒デモの録画（v2）：出発地・到着地を入力、2か所で撮影、共有をしっかり見せる
// usage: node rec2.cjs <cafe-photo> <park-photo>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = __dirname + '/rec2';
const U = 'https://antengm79-dot.github.io/meguroute/#';
const dataUrl = (f) => `data:image/${path.extname(f).slice(1).replace('jpg', 'jpeg')};base64,` + fs.readFileSync(f).toString('base64');
const PHOTOS = [dataUrl(process.argv[2]), dataUrl(process.argv[3])];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  await ctx.addInitScript(() => {
    // tap indicator
    addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:22px;background:rgba(161,249,161,.55);border:3px solid rgba(8,7,143,.55);z-index:99999;pointer-events:none;transition:transform .45s,opacity .45s`;
      document.documentElement.appendChild(d);
      requestAnimationFrame(() => { d.style.transform = 'scale(1.6)'; d.style.opacity = '0'; });
      setTimeout(() => d.remove(), 600);
    }, true);
    // camera: show the photo set in window.__camSrc (slight hand-held motion)
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async () => {
        const c = document.createElement('canvas');
        c.width = 720; c.height = 1280;
        const ctx2 = c.getContext('2d');
        const im = new Image();
        im.src = window.__camSrc || '';
        await new Promise((r) => { im.onload = r; im.onerror = r; });
        const t0 = performance.now();
        const draw = () => {
          const t = (performance.now() - t0) / 1000;
          const k = 1.06 + 0.01 * Math.sin(t * 1.3);
          const ir = (im.naturalWidth || 1) / (im.naturalHeight || 1), cr = c.width / c.height;
          let w = c.width, h = c.height;
          if (ir > cr) w = h * ir; else h = w / ir;
          w *= k; h *= k;
          ctx2.fillStyle = '#000'; ctx2.fillRect(0, 0, c.width, c.height);
          if (im.naturalWidth) ctx2.drawImage(im, (c.width - w) / 2 + 6 * Math.sin(t * 0.9), (c.height - h) / 2 + 5 * Math.cos(t * 1.1), w, h);
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
    // カフェは先頭（喫茶ミナモ）、公園はうめきた公園を選ぶ
    const want = ['喫茶ミナモ', 'うめきた公園'];
    const secs = await p.$$('section');
    for (let i = 0; i < secs.length; i++) {
      const btn = (await secs[i].$(`.hscroll button:has-text("${want[i]}")`)) || (await secs[i].$('.hscroll button'));
      if (btn) { await btn.scrollIntoViewIfNeeded(); await w(300); await btn.click(); await w(1300); await tap('.sheet >> text=ここにする'); await w(500); }
    }
    await tap('text=決定してルートを作る'); await w(400); mark('route'); await w(5500);
    await tap('text=旅をスタート'); await w(200); mark('trip');
    let n = 0;
    for (let i = 0; i < 200 && n < 2; i++) {
      await w(250);
      if (await p.$('text=写真を撮りますか？')) {
        await p.evaluate((src) => { window.__camSrc = src; }, PHOTOS[n]);
        n++;
        await w(700); mark('arrive' + n);
        await tap('.modal >> text=撮影する'); await w(2400); mark('camera' + n);
        await tap('[aria-label="シャッター"]'); await w(800); await tap('[aria-label="シャッター"]'); await w(800);
        await tap('text=完了して旅にもどる'); await w(300); mark('back' + n);
      }
    }
    for (let i = 0; i < 60; i++) { await w(250); if ((await p.textContent('body')).includes('ゴール')) break; }
    await w(800); mark('goal');
    await tap('text=旅を終了'); mark('end'); await w(5500);
    await tap('text=10秒Vlogをつくる'); await w(500); mark('vlog'); await w(3000);
    await tap('button:has-text("ピンク")'); await w(2000);
    await scroll(400); await w(900);
    await tap('text=ルートを公開する'); await w(900); mark('publish');
    await tap('.seg >> text=全体'); await w(700);
    await tap('text=公開する'); await w(1600); mark('published');
    await tap('text=みんなのルートを見る'); await w(1200); mark('feed');
    await tap('article >> nth=0 >> button:has-text("0")'); await w(1500);
    await scroll(420); await w(1500);
    await tap('text=マイページ'); await w(1000); mark('me');
    await scroll(430); await w(2600);
    mark('done');
  } catch (e) { console.log('SCRIPT', e.message.slice(0, 300)); }
  await ctx.close();
  fs.writeFileSync(OUT + '/marks.json', JSON.stringify(marks));
  console.log(JSON.stringify(marks));
  await b.close();
})();
