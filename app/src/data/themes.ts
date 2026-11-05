export type Theme = { id: string; name: string; base: string; accent: string };

export const THEMES: Theme[] = [
  { id: "mint", name: "ミッドナイト×ミント", base: "#08078F", accent: "#A1F9A1" },
  { id: "lemon", name: "グレープ×レモン", base: "#2E0B6B", accent: "#F2FF5C" },
  { id: "pink", name: "ブラック×ネオンピンク", base: "#141418", accent: "#FF7AC6" },
  { id: "sun", name: "フォレスト×サンイエロー", base: "#0E3B33", accent: "#FFE45C" },
  { id: "peach", name: "コバルト×ピーチ", base: "#1B2FC9", accent: "#FFC7A3" },
  { id: "cyan", name: "チャコール×シアン", base: "#1A1F2B", accent: "#7CF4FF" },
  { id: "berry", name: "ベリー×ミルク", base: "#7A0F4A", accent: "#FFD6E8" },
  { id: "tomato", name: "トマト×クリーム", base: "#D93A1E", accent: "#FFF1C2" },
  { id: "ocean", name: "オーシャン×ライム", base: "#004E7A", accent: "#D4FF6B" },
  { id: "lilac", name: "ラベンダー×インク", base: "#3B2A8F", accent: "#D9C8FF" },
  { id: "matcha", name: "抹茶×あずき", base: "#2F5D2F", accent: "#F3E3C3" },
  { id: "coral", name: "ネイビー×コーラル", base: "#13235B", accent: "#FF8C7A" },
  { id: "orange", name: "ブラウン×オレンジ", base: "#3D1F0F", accent: "#FFB347" },
  { id: "sky", name: "ミッドナイト×スカイ", base: "#0B1340", accent: "#8FD3FF" },
];

export type Frame = { id: string; name: string; css: string; minLevel?: number };

export const FRAMES: Frame[] = [
  { id: "accent", name: "テーマ色", css: "var(--accent)" },
  { id: "white", name: "ホワイト", css: "#FFFFFF" },
  { id: "navy", name: "ネイビー", css: "#08078F" },
  { id: "pink", name: "ピンク", css: "#FF7AC6" },
  { id: "lemon", name: "レモン", css: "#F2FF5C" },
  { id: "sky", name: "スカイ", css: "#8FD3FF" },
  { id: "peach", name: "ピーチ", css: "#FFC7A3" },
  { id: "lilac", name: "ライラック", css: "#C9B6FF" },
  { id: "black", name: "ブラック", css: "#141418" },
  { id: "gold", name: "ゴールド", css: "linear-gradient(135deg,#8A6A12,#F7D774 30%,#FFF4C4 50%,#E2B33C 70%,#8A6A12)", minLevel: 10 },
  { id: "aurora", name: "オーロラ", css: "linear-gradient(135deg,#7CF4FF,#A1F9A1 25%,#F2FF5C 45%,#FF7AC6 70%,#9B7BFF)", minLevel: 20 },
];

export const frameById = (id: string) => FRAMES.find((f) => f.id === id) ?? FRAMES[0];

/** level → color used for user badges / route cards */
export function levelColor(lv: number): string {
  if (lv >= 20) return FRAMES.find((f) => f.id === "aurora")!.css;
  if (lv >= 10) return FRAMES.find((f) => f.id === "gold")!.css;
  if (lv >= 5) return "#4C6FFF";
  return "#9AA3B5";
}

export const XP_PER_LEVEL = 100;
export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
