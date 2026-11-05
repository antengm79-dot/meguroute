import type { LngLat } from "./geo";
import { bounds } from "./geo";

export const W = 720;
export const H = 1280;
export const DURATION = 10; // seconds
const END = 1.6; // end card seconds

export type VlogShot = { img?: HTMLImageElement; hue: number; spot: string };
export type VlogOpts = {
  shots: VlogShot[];
  frame: string[]; // 1 color or gradient stops
  base: string;
  accent: string;
  route: LngLat[];
  date: string;
  stats: string;
  logo?: HTMLImageElement;
};

function frameFill(ctx: CanvasRenderingContext2D, colors: string[]) {
  if (colors.length === 1) return colors[0];
  const g = ctx.createLinearGradient(0, 0, W, H);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  return g;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPhoto(ctx: CanvasRenderingContext2D, s: VlogShot, k: number, alpha: number, inner: { x: number; y: number; w: number; h: number }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  rr(ctx, inner.x, inner.y, inner.w, inner.h, 34);
  ctx.clip();
  const zoom = 1 + 0.08 * k;
  if (s.img && s.img.naturalWidth) {
    const ir = s.img.naturalWidth / s.img.naturalHeight;
    const br = inner.w / inner.h;
    let dw = inner.w, dh = inner.h;
    if (ir > br) dw = inner.h * ir; else dh = inner.w / ir;
    dw *= zoom; dh *= zoom;
    ctx.drawImage(s.img, inner.x + (inner.w - dw) / 2, inner.y + (inner.h - dh) / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w, inner.y + inner.h);
    g.addColorStop(0, `hsl(${s.hue} 72% 78%)`);
    g.addColorStop(1, `hsl(${(s.hue + 45) % 360} 70% 60%)`);
    ctx.fillStyle = g;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.beginPath();
    ctx.arc(inner.x + inner.w * 0.72, inner.y + inner.h * 0.28, 50 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }
  // soft vignette so the name reads
  const v = ctx.createLinearGradient(0, inner.y + inner.h * 0.3, 0, inner.y + inner.h * 0.7);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(0.5, "rgba(0,0,0,.28)");
  v.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = v;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  ctx.restore();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number, size: number, font: string) {
  let s = size;
  do {
    ctx.font = `${s}px ${font}`;
    s -= 2;
  } while (ctx.measureText(text).width > max && s > 20);
}

export function render(ctx: CanvasRenderingContext2D, t: number, o: VlogOpts) {
  const pad = 30;
  const inner = { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2 };
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = frameFill(ctx, o.frame);
  ctx.fillRect(0, 0, W, H);

  const photoT = DURATION - END;
  const n = Math.max(1, o.shots.length);
  const per = photoT / n;

  if (t < photoT) {
    const i = Math.min(n - 1, Math.floor(t / per));
    const k = (t - i * per) / per;
    const s = o.shots[i] ?? { hue: 220, spot: "" };
    if (i > 0 && k < 0.18) drawPhoto(ctx, o.shots[i - 1], 1, 1, inner);
    drawPhoto(ctx, s, k, i > 0 ? Math.min(1, k / 0.18) : 1, inner);

    // place name in the center
    const pop = Math.min(1, k / 0.15);
    ctx.save();
    ctx.globalAlpha = pop;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 24;
    fitText(ctx, s.spot, inner.w - 80, 78, '"Dela Gothic One"');
    ctx.translate(W / 2, H / 2);
    ctx.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop);
    ctx.fillText(s.spot, 0, 0);
    ctx.shadowBlur = 0;
    ctx.font = '900 22px "Unbounded"';
    ctx.fillStyle = o.accent;
    ctx.fillText(`${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`, 0, 70);
    ctx.restore();

    // footer
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = '700 22px "Zen Kaku Gothic New"';
    ctx.fillText(o.date, W / 2, H - pad - 50);
    ctx.restore();
  } else {
    // end card: the walked route
    const k = Math.min(1, (t - photoT) / 0.9);
    ctx.save();
    rr(ctx, inner.x, inner.y, inner.w, inner.h, 34);
    ctx.clip();
    ctx.fillStyle = "#fff";
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    ctx.strokeStyle = o.base + "18";
    ctx.lineWidth = 1;
    for (let x = inner.x; x < inner.x + inner.w; x += 22) { ctx.beginPath(); ctx.moveTo(x, inner.y); ctx.lineTo(x, inner.y + inner.h); ctx.stroke(); }
    for (let y = inner.y; y < inner.y + inner.h; y += 22) { ctx.beginPath(); ctx.moveTo(inner.x, y); ctx.lineTo(inner.x + inner.w, y); ctx.stroke(); }
    if (o.route.length > 1) {
      const [[x0, y0], [x1, y1]] = bounds(o.route);
      const box = { x: inner.x + 80, y: inner.y + 260, w: inner.w - 160, h: inner.h - 620 };
      const kx = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
      const sc = Math.min(box.w / ((x1 - x0) * kx || 1e-6), box.h / ((y1 - y0) || 1e-6));
      const ox = box.x + (box.w - (x1 - x0) * kx * sc) / 2;
      const oy = box.y + (box.h - (y1 - y0) * sc) / 2;
      const P = ([x, y]: LngLat) => [ox + (x - x0) * kx * sc, oy + (y1 - y) * sc];
      const upto = Math.max(2, Math.floor(o.route.length * k));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const [wdt, col, blur] of [[26, o.accent, 18], [12, o.base + "55", 0], [9, o.accent, 0]] as const) {
        ctx.beginPath();
        o.route.slice(0, upto).forEach((p, j) => { const [a, b] = P(p); if (j) ctx.lineTo(a, b); else ctx.moveTo(a, b); });
        ctx.strokeStyle = col;
        ctx.lineWidth = wdt;
        ctx.shadowColor = o.accent;
        ctx.shadowBlur = blur;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    ctx.textAlign = "center";
    ctx.fillStyle = o.base;
    ctx.font = '900 24px "Unbounded"';
    ctx.fillText("MY ROUTE", W / 2, inner.y + 150);
    ctx.font = '40px "Dela Gothic One"';
    ctx.fillText(o.stats, W / 2, inner.y + 205);
    if (o.logo) {
      const lw = 300, lh = (o.logo.naturalHeight / o.logo.naturalWidth) * lw;
      ctx.drawImage(o.logo, (W - lw) / 2, inner.y + inner.h - lh - 90, lw, lh);
    }
    ctx.restore();
  }
}

export function frameColors(css: string, accent: string): string[] {
  if (css.startsWith("var(")) return [accent];
  const m = css.match(/#[0-9a-fA-F]{6}/g);
  return m && m.length ? m : [css];
}

export async function loadImg(src?: string): Promise<HTMLImageElement | undefined> {
  if (!src) return undefined;
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(undefined);
    im.src = src;
  });
}
