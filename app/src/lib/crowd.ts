import type { Shop } from "../data/spots";

/**
 * 課金店舗の混雑状況（ESP32センサー、またはみんなの蓄積データからの予測）。
 * デモ用に、店ごとの基準人数に時間でゆるく揺らぎをつけた値を返す。
 */
const BASE: Record<string, number> = { c1: 8, c3: 9, b1: 25, c5: 10 };
const CAP = 30;

export function crowdNow(id: string, t = Date.now()) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = BASE[id] ?? 12 + (seed % 10);
  const n = Math.max(2, Math.min(CAP, Math.round(base + 2 * Math.sin(t / 9000 + seed))));
  const ratio = n / CAP;
  const label = ratio < 0.5 ? "空いています" : ratio < 0.75 ? "やや混雑" : "混雑";
  const color = ratio < 0.5 ? "#1E9E5A" : ratio < 0.75 ? "#E8A300" : "#D6204A";
  return { n, cap: CAP, ratio, label, color };
}

/** 課金店舗で、いま空いているときだけ「空き」として目立たせる */
export const isVacant = (shop: Shop) => !!shop.featured && crowdNow(shop.id).ratio < 0.5;
