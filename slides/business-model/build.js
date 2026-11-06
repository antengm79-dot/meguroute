// ⑥ビジネスモデル・⑦マネタイズ の2枚（フェーズ1→2→3の流れを分かりやすく）
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/root/.claude/skills/synced/1f4e3d59-692f-489e-95a2-d48cec6ed4b9_518ae2f6-7945-4b05-ac4d-32c179df57df/pptx/scripts/apply_theme.js");

const D = __dirname;
const LOGO = "/home/user/meguroute/app/public/logo.png";
const ICON = "/home/user/meguroute/app/public/logo-icon.png";
const FONT = "Noto Sans JP";
const NAVY = "080789", MINT = "B5F7A9", PANEL = "F2F3F9", GOLD = "D6A237", COIN = "F6CD4E", MUTED = "6E7191";
const THEME = {
  name: "Meguroute", headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1: "12133A", lt1: "FFFFFF", dk2: NAVY, lt2: PANEL, accent1: NAVY, accent2: MINT, accent3: "5A5F82", accent4: "1E9E5A", accent5: "D9E3FF", accent6: GOLD, hlink: NAVY, folHlink: "5A5F82" },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = "めぐる〜と ビジネスモデル・マネタイズ";

// helpers in source-pixel units
function mk(slide, k) {
  const u = (v) => v * k;
  const R = { x: 0, y: 0 };
  return {
    box(x, y, w, h, o = {}) {
      slide.addShape(o.round === false ? pres.shapes.RECTANGLE : pres.shapes.ROUNDED_RECTANGLE, {
        x: u(x), y: u(y), w: u(w), h: u(h), rectRadius: o.r ?? 0.08,
        fill: o.fill ? { color: o.fill, transparency: o.t ?? 0 } : { type: "none" },
        line: o.line ? { color: o.line, width: o.lw ?? 1, dashType: o.dash ?? "solid" } : { type: "none" },
        objectName: o.name,
      });
    },
    circle(x, y, d, o = {}) {
      slide.addShape(pres.shapes.OVAL, { x: u(x), y: u(y), w: u(d), h: u(d), fill: { color: o.fill }, line: o.line ? { color: o.line, width: o.lw ?? 1 } : { type: "none" }, objectName: o.name });
    },
    text(t, x, y, w, h, o = {}) {
      slide.addText(t, { x: u(x), y: u(y), w: u(w), h: u(h), fontSize: o.size ?? 11, bold: o.bold ?? false, color: o.color ?? NAVY, align: o.align ?? "left", valign: o.valign ?? "middle", margin: 0, isTextBox: true, lineSpacingMultiple: o.ls ?? 1.0, objectName: o.name });
    },
    img(p, x, y, w, h, alt) { slide.addImage({ path: p, x: u(x), y: u(y), w: u(w), h: u(h), altText: alt }); },
    line(x1, y1, x2, y2, o = {}) {
      slide.addShape(pres.shapes.LINE, {
        x: u(Math.min(x1, x2)), y: u(Math.min(y1, y2)), w: u(Math.abs(x2 - x1)), h: u(Math.abs(y2 - y1)),
        line: { color: o.color ?? NAVY, width: o.w ?? 1.5, dashType: o.dash ?? "solid", endArrowType: o.end, beginArrowType: o.begin, transparency: o.t ?? 0 },
      });
    },
    u,
  };
}

/* ---------------- ⑥ ビジネスモデル ---------------- */
{
  const s = pres.addSlide();
  s.background = { color: "FFFFFF" };
  const P = mk(s, 10 / 1644);

  P.box(78, 51, 393, 48, { fill: MINT, r: 0.2 });
  P.text("⑥ ビジネスモデル", 78, 51, 393, 48, { size: 10.9, bold: true, align: "center" });
  P.text("ユーザーは無料、貯まるデータでお店と自治体から収益を得る", 78, 112, 1500, 76, { size: 17.9, bold: true });

  // phase frames (new): number badge + label, framed so the eye goes 1 → 2 → 3
  const phase = (n, label, title, fx, fy, fw, fh, lx, ly) => {
    P.box(fx, fy, fw, fh, { line: NAVY, lw: 1.75, r: 0.12, name: `phase ${n} frame` });
    P.circle(lx, ly + 2, 42, { fill: NAVY, name: `phase ${n} badge` });
    P.text(String(n), lx, ly + 2, 42, 42, { size: 11, bold: true, color: MINT, align: "center" });
    P.text(label, lx + 50, ly - 2, 300, 22, { size: 7.8, bold: true, color: MUTED });
    P.text(title, lx + 50, ly + 20, 420, 30, { size: 9.2, bold: true });
  };
  phase(1, "フェーズ1", "ユーザーを集める", 60, 352, 236, 336, 70, 368);
  phase(2, "フェーズ2", "契約店舗を集める", 784, 178, 796, 390, 800, 192);
  phase(3, "フェーズ3", "データを自治体へ", 784, 576, 796, 262, 800, 584);

  // user card
  P.box(76, 443, 200, 228, { fill: PANEL });
  P.img(path.join(D, "user.png"), 150, 455, 55, 55, "ユーザーのアイコン");
  P.text("ユーザー", 76, 515, 200, 36, { size: 12.5, bold: true, align: "center" });
  P.box(146, 556, 55, 24, { fill: "FFFFFF", r: 0.12 });
  P.text("toC", 146, 556, 55, 24, { size: 7.0, bold: true, align: "center" });
  P.text("10〜20代の\n観光客", 76, 594, 200, 54, { size: 8.6, align: "center", ls: 1.15 });

  // user <-> service arrows
  P.text("ルート・写真\n行動履歴", 285, 474, 148, 50, { size: 7.8, bold: true, align: "center" });
  P.line(282, 530, 433, 530, { end: "triangle" });
  P.line(282, 585, 433, 585, { begin: "triangle" });
  P.text("無料で利用", 285, 594, 148, 26, { size: 7.8, bold: true, align: "center" });

  // center: own service
  P.box(437, 357, 196, 400, { fill: NAVY, r: 0.06 });
  P.circle(461, 373, 148, { fill: "FFFFFF" });
  P.img(ICON, 497, 400, 76, 48, "めぐる〜とのアイコン");
  P.text("めぐる〜と", 461, 458, 148, 30, { size: 8.6, bold: true, align: "center" });
  P.box(449, 537, 172, 49, { fill: MINT, r: 0.25 });
  P.text("自社サービス", 449, 537, 172, 49, { size: 10.1, bold: true, align: "center" });
  P.text("使われるほど\n人流データが貯まる", 437, 616, 196, 66, { size: 8.6, bold: true, color: "FFFFFF", align: "center", ls: 1.2 });

  // service <-> store / gov arrows and money
  const money = (y, label) => {
    P.line(636, y, 784, y, { color: GOLD, w: 2.25, begin: "triangle" });
    P.circle(636, y + 9, 34, { fill: COIN, line: GOLD, lw: 1.5 });
    P.text("¥", 636, y + 9, 34, 34, { size: 8.6, bold: true, align: "center" });
    P.box(676, y + 9, 120, 34, { fill: MINT, r: 0.25 });
    P.text(label, 676, y + 9, 120, 34, { size: 7.8, bold: true, align: "center" });
  };
  P.text("優先表示\n来客予測", 646, 334, 130, 48, { size: 7.8, bold: true, align: "center" });
  P.line(636, 388, 784, 388, { end: "triangle" });
  money(440, "月額料金");
  P.text("人流データ\nレポート", 646, 628, 130, 48, { size: 7.8, bold: true, align: "center" });
  P.line(636, 683, 784, 683, { end: "triangle" });
  money(733, "データ利用料");

  // stores (phase 2)
  P.box(797, 262, 770, 296, { fill: PANEL });
  P.img(path.join(D, "store.png"), 815, 279, 45, 34, "店舗のアイコン");
  P.text("店舗", 868, 278, 70, 36, { size: 12.5, bold: true });
  P.box(930, 285, 55, 26, { fill: "FFFFFF", r: 0.12 });
  P.text("toB", 930, 285, 55, 26, { size: 7.0, bold: true, align: "center" });
  const plan = (x, name, price, items, border) => {
    P.box(x, 330, 246, 220, { fill: "FFFFFF", line: border, lw: border === NAVY ? 2 : 2.5 });
    P.text(name, x + 13, 340, 220, 30, { size: 9.4, bold: true });
    s.addText([{ text: "月額 ", options: { fontSize: 7.0, bold: true } }, { text: price, options: { fontSize: 15, bold: true } }],
      { x: P.u(x + 13), y: P.u(380), w: P.u(225), h: P.u(54), color: NAVY, margin: 0, valign: "middle", isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 9 }, breakLine: i < items.length - 1 } })),
      { x: P.u(x + 13), y: P.u(442), w: P.u(228), h: P.u(84), fontSize: 7.4, color: NAVY, margin: 0, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  };
  plan(815, "スタンダード", "1万円", ["店舗の基本情報・写真", "おすすめ表示", "来客予測"], MINT);
  plan(1072, "センサー付き", "1.5万円", ["ESP32を店内に設置", "リアルタイム人数表示", "来客予測プレミアム"], NAVY);
  P.box(1082, 266, 198, 34, { fill: MINT, line: NAVY, lw: 1.25, r: 0.15 });
  P.text("ハッカソンの技術！", 1082, 266, 198, 34, { size: 8.2, bold: true, align: "center" });
  P.img(path.join(D, "esp.png"), 1224, 318, 86, 58, "ESP32の写真");
  P.img(path.join(D, "dash.png"), 1328, 366, 228, 168, "店舗向けダッシュボードの画面");

  // municipalities (phase 3)
  P.box(797, 636, 770, 194, { fill: PANEL });
  P.img(path.join(D, "gov.png"), 812, 645, 46, 32, "自治体のアイコン");
  P.text("自治体", 866, 643, 90, 36, { size: 12.5, bold: true });
  P.box(958, 650, 50, 24, { fill: "FFFFFF", r: 0.12 });
  P.text("toG", 958, 650, 50, 24, { size: 7.0, bold: true, align: "center" });
  P.box(1036, 645, 154, 32, { line: NAVY, lw: 1.25, dash: "dash", r: 0.2 });
  P.text("＋ 企業など…", 1036, 645, 154, 32, { size: 8.2, bold: true, align: "center" });
  const gov = (x, name, price) => {
    P.box(x, 690, 246, 128, { fill: "FFFFFF" });
    P.text(name, x + 13, 700, 220, 32, { size: 9.4, bold: true });
    s.addText([{ text: "月額 ", options: { fontSize: 7.0, bold: true } }, { text: price, options: { fontSize: 15, bold: true } }],
      { x: P.u(x + 13), y: P.u(742), w: P.u(225), h: P.u(56), color: NAVY, margin: 0, valign: "middle", isTextBox: true });
  };
  gov(815, "市区町村", "300万円");
  gov(1072, "都道府県", "1,000万円");
  P.img(path.join(D, "report.png"), 1328, 664, 230, 160, "自治体向け人流レポートの画面");

  // legend, logo, page
  P.line(540, 862, 588, 862, { color: GOLD, w: 2.5 });
  P.text("お金の流れ", 596, 850, 120, 24, { size: 7.0, bold: true, color: MUTED });
  P.img(LOGO, 1280, 846, 245, 51, "めぐる〜と ロゴ");
  P.text("10", 1532, 852, 60, 34, { size: 8.6, color: "B0B3C8" });
}

/* ---------------- ⑦ マネタイズ・市場規模 ---------------- */
{
  const s = pres.addSlide();
  s.background = { color: "FFFFFF" };
  const P = mk(s, 10 / 1362);

  P.box(37, 39, 329, 40, { fill: MINT, r: 0.2 });
  P.text("⑦ マネタイズ・市場規模", 37, 39, 329, 40, { size: 12, bold: true, align: "center" });
  P.text("2年目に黒字化し、10年目に売上46,677万円をめざす", 60, 90, 1260, 60, { size: 21, bold: true });

  // chart (same as before)
  P.img(path.join(D, "chart.png"), 60, 236, 1280, 384, "年度別の売上内訳と費用のグラフ");

  // phase steps: numbered, filled from light to dark so 1 → 2 → 3 reads as progress
  const steps = [
    { n: 1, x: 62, w: 350, fill: "E6FBE2", fg: NAVY, title: "ユーザーを集める", shape: pres.shapes.PENTAGON },
    { n: 2, x: 418, w: 598, fill: MINT, fg: NAVY, title: "契約店舗を集める", shape: pres.shapes.CHEVRON },
    { n: 3, x: 1022, w: 300, fill: NAVY, fg: "FFFFFF", title: "データを自治体へ", shape: pres.shapes.CHEVRON },
  ];
  for (const st of steps) {
    s.addShape(st.shape, { x: P.u(st.x), y: P.u(155), w: P.u(st.w), h: P.u(68), fill: { color: st.fill }, line: { type: "none" }, objectName: `phase ${st.n}` });
    const bx = st.x + (st.n === 1 ? 18 : 40);
    P.circle(bx, 167, 44, { fill: st.n === 3 ? MINT : NAVY });
    P.text(String(st.n), bx, 167, 44, 44, { size: 14, bold: true, color: st.n === 3 ? NAVY : MINT, align: "center" });
    P.text("フェーズ" + st.n, bx + 56, 160, 250, 24, { size: 8, bold: true, color: st.fg });
    P.text(st.title, bx + 56, 182, 300, 32, { size: 11, bold: true, color: st.fg });
  }
  // phase boundaries carried down through the chart
  for (const x of [415, 1019]) P.line(x, 282, x, 618, { color: NAVY, w: 1, dash: "dash", t: 45 });

  // TAM / SAM / SOM: nested circles + rows
  P.box(35, 585, 435, 155, { fill: PANEL, r: 0.1 });
  P.text("総市場（収益源）", 50, 590, 200, 24, { size: 9.5, bold: true });
  P.circle(52, 618, 116, { fill: "DCDEF4", line: NAVY, lw: 0.75 });
  P.circle(74, 656, 78, { fill: "8F92DD" });
  P.circle(94, 692, 40, { fill: NAVY });
  P.text("TAM", 52, 622, 116, 22, { size: 8, bold: true, align: "center" });
  P.text("SAM", 74, 660, 78, 20, { size: 8, bold: true, color: "FFFFFF", align: "center" });
  P.text("SOM", 94, 692, 40, 40, { size: 7, bold: true, color: MINT, align: "center" });
  const rows = [
    { k: "TAM", c: "DCDEF4", fg: NAVY, v: "約1,700億円/年", d: "全国の小売店 50万店" },
    { k: "SAM", c: "8F92DD", fg: "FFFFFF", v: "約115億円/年", d: "大阪府の小売店 4万店" },
    { k: "SOM", c: NAVY, fg: MINT, v: "約4.5億円/年", d: "5年目 府内600店" },
  ];
  rows.forEach((r, i) => {
    const y = 612 + i * 41;
    P.box(186, y + 2, 54, 22, { fill: r.c, r: 0.15 });
    P.text(r.k, 186, y + 2, 54, 22, { size: 8.5, bold: true, color: r.fg, align: "center" });
    P.text(r.v, 248, y, 210, 24, { size: 9.5, bold: true });
    P.text(r.d, 248, y + 23, 210, 15, { size: 7.5, color: MUTED });
  });

  // spending & target
  P.box(517, 625, 413, 120, { fill: NAVY, r: 0.08 });
  P.text("10〜20代の国内日帰り旅行消費額", 537, 632, 380, 26, { size: 10, bold: true, color: MINT });
  P.text("約1.1兆円", 537, 658, 380, 52, { size: 26, bold: true, color: "FFFFFF" });
  P.text("旅行・観光消費動向調査（2026年）", 537, 712, 380, 24, { size: 8.5, color: "FFFFFF" });
  P.box(950, 630, 365, 62, { fill: PANEL, r: 0.15 });
  P.text("1,821万人", 962, 630, 160, 62, { size: 14, bold: true });
  s.addText([{ text: "ターゲットの15〜29歳", options: { bold: true, breakLine: true } }, { text: "高校生〜若手社会人" }],
    { x: P.u(1122), y: P.u(634), w: P.u(190), h: P.u(54), fontSize: 8.5, color: NAVY, margin: 0, valign: "middle", isTextBox: true });

  P.img(LOGO, 1075, 704, 230, 48, "めぐる〜と ロゴ");
  P.text("8", 1316, 712, 30, 32, { size: 12, bold: true, color: "12133A", align: "center" });
}

(async () => {
  const out = path.join(D, "meguroute-business-model.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
})();
