import type { LngLat } from "../lib/geo";
import { OSAKA_PLACES, OSAKA_SHOPS } from "./osakaSpots";

export type Photo = {
  id: string;
  /** real photo path (put files in public/photos/). Falls back to a color placeholder. */
  src?: string;
  hue: number;
  by?: string;
  label?: string;
};

export type Featured = {
  genre: string;
  price: string;
  hours: string;
  holiday: string;
  menu: string;
  intro: string;
  official: Photo[];
  /** ESP32 congestion sensor installed */
  sensor?: boolean;
  plan: "standard" | "sensor";
};

export type Shop = {
  id: string;
  name: string;
  cat: string;
  pos: LngLat;
  tags: string[];
  photos: Photo[];
  featured?: Featured;
  /** 実在のお店（osaka_spots.csv）の住所とエリア */
  address?: string;
  area?: string;
};

const ph = (id: string, n: number, hue: number, by: string[] = ["saki_osaka", "mio_walk", "yuu_sweets", "nana.trip"]): Photo[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${id}-${i + 1}`,
    src: `photos/${id}-${i + 1}.jpg`,
    hue: (hue + i * 23) % 360,
    by: by[i % by.length],
  }));

const DEMO_SHOPS: Shop[] = [
  // ---- 梅田・茶屋町
  {
    id: "c1", name: "喫茶ミナモ", cat: "cafe", pos: [135.4996, 34.7061],
    tags: ["おしゃれ", "景色がいい", "コーヒー・紅茶", "スイーツ", "〜1,000円", "〜2,000円", "落ち着く", "屋内", "営業中のみ"],
    photos: ph("c1", 6, 28),
    featured: {
      genre: "カフェ・喫茶", price: "¥800〜¥1,500", hours: "9:00〜20:00", holiday: "水曜日",
      menu: "ハンドドリップ珈琲 / 自家製プリン / クリームソーダ",
      intro: "大きな窓から茶屋町の街並みが見える、光のきれいな喫茶店。",
      official: ph("c1o", 3, 200, ["公式"]), sensor: true, plan: "sensor",
    },
  },
  { id: "c2", name: "Coffee Stand NORTH", cat: "cafe", pos: [135.4979, 34.7049], tags: ["落ち着く", "コーヒー・紅茶", "〜500円", "屋内"], photos: ph("c2", 3, 30) },
  { id: "s1", name: "クレープ ハルノ", cat: "sweets", pos: [135.4983, 34.7057], tags: ["クレープ", "食べ歩き", "テイクアウト", "写真映え", "安さ"], photos: ph("s1", 4, 330) },
  { id: "a1", name: "ナゾトキあそびば梅田", cat: "play", pos: [135.4990, 34.7040], tags: ["謎解き", "友達", "グループ", "〜1時間", "屋内"], photos: ph("a1", 2, 260) },
  { id: "e1", name: "シネマ茶屋町", cat: "movie", pos: [135.4992, 34.7066], tags: ["恋愛", "アニメ", "通常上映", "すぐ観られる", "屋内"], photos: ph("e1", 2, 240) },
  { id: "i1", name: "ねこカフェ ゴロン", cat: "relax", pos: [135.5015, 34.7035], tags: ["動物", "のんびり", "〜1,000円", "〜3,000円", "屋内"], photos: ph("i1", 3, 40) },
  { id: "j1", name: "露天神社（お初天神）", cat: "shrine", pos: [135.5005, 34.7010], tags: ["お参り", "御朱印", "縁結び", "有名な場所", "歴史・建築", "屋外", "無料"], photos: ph("j1", 4, 0) },
  { id: "g1", name: "うどん 梅月", cat: "gourmet", pos: [135.5010, 34.7044], tags: ["和食", "麺類", "軽く食べたい", "普通に食事", "〜1,000円"], photos: ph("g1", 3, 45) },
  { id: "g2", name: "ソウル食堂 ミナミ", cat: "gourmet", pos: [135.5020, 34.7052], tags: ["中華・韓国", "がっつり食べたい", "〜2,000円"], photos: ph("g2", 2, 10) },

  // ---- 中崎町
  {
    id: "c3", name: "中崎珈琲舎", cat: "cafe", pos: [135.5041, 34.7072],
    tags: ["レトロ", "落ち着く", "コーヒー・紅茶", "軽食", "〜1,000円", "屋内", "空いている場所"],
    photos: ph("c3", 5, 25),
    featured: {
      genre: "レトロ喫茶", price: "¥600〜¥1,200", hours: "10:00〜19:00", holiday: "月曜日",
      menu: "ネルドリップ珈琲 / たまごサンド / 固めプリン",
      intro: "長屋を改装した、昭和レトロな空間でゆっくりできる喫茶店。",
      official: ph("c3o", 3, 20, ["公式"]), plan: "standard",
    },
  },
  { id: "c4", name: "Cafe Hidamari", cat: "cafe", pos: [135.5052, 34.7076], tags: ["おしゃれ", "スイーツ", "おしゃべり", "〜1,000円", "屋内"], photos: ph("c4", 4, 50) },
  {
    id: "b1", name: "古着屋 ROUTE", cat: "shopping", pos: [135.5061, 34.7081],
    tags: ["洋服・古着", "個人店", "個性的なお店", "流行のお店", "いいものがあれば買う", "屋内"],
    photos: ph("b1", 5, 290),
    featured: {
      genre: "古着・ヴィンテージ", price: "¥1,500〜¥8,000", hours: "12:00〜20:00", holiday: "不定休",
      menu: "USヴィンテージ / 古着リメイク / アクセサリー",
      intro: "中崎町の路地裏。1点もののアメリカ古着とリメイク服がそろう。",
      official: ph("b1o", 3, 280, ["公式"]), sensor: true, plan: "sensor",
    },
  },
  { id: "b2", name: "雑貨 ことり舎", cat: "shopping", pos: [135.5049, 34.7085], tags: ["雑貨", "個人店", "見るだけ", "屋内"], photos: ph("b2", 3, 90) },
  { id: "b3", name: "Vintage MOON", cat: "shopping", pos: [135.5068, 34.7078], tags: ["洋服・古着", "流行のお店", "買い物したい"], photos: ph("b3", 3, 300) },
  { id: "s2", name: "ジェラート ソラ", cat: "sweets", pos: [135.5058, 34.7066], tags: ["アイス・ジェラート", "食べ歩き", "写真映え", "限定メニュー"], photos: ph("s2", 4, 170) },
  { id: "h1", name: "中崎町の路地", cat: "photo", pos: [135.5056, 34.7074], tags: ["レトロ", "建物・街並み", "SNSに投稿したい", "おしゃれな写真", "屋外", "無料"], photos: ph("h1", 4, 35) },
  { id: "k1", name: "コンビニ 中崎町店", cat: "conveni", pos: [135.5030, 34.7069], tags: ["飲み物", "お菓子", "トイレ", "どこでもOK"], photos: ph("k1", 1, 120) },

  // ---- 中之島・北浜
  { id: "p1", name: "中之島バラ園", cat: "park", pos: [135.5086, 34.6928], tags: ["散歩", "写真を撮る", "花・緑", "水辺", "ベンチ", "トイレ", "屋外", "無料"], photos: ph("p1", 6, 340) },
  { id: "r1", name: "大川の遊歩道", cat: "river", pos: [135.5098, 34.6936], tags: ["景色を見る", "散歩する", "川", "夕日", "遊歩道がある", "座って休める", "屋外"], photos: ph("r1", 3, 210) },
  {
    id: "c5", name: "川床カフェ ナギ", cat: "cafe", pos: [135.5069, 34.6908],
    tags: ["景色がいい", "おしゃれ", "スイーツ", "おしゃべり", "〜2,000円", "屋外", "夕日"],
    photos: ph("c5", 5, 15),
    featured: {
      genre: "テラスカフェ", price: "¥1,000〜¥2,000", hours: "11:00〜21:00", holiday: "火曜日",
      menu: "季節のパフェ / クラフトレモネード / 夕暮れセット",
      intro: "土佐堀川に面したテラス席から、夕日に染まる中之島を眺められる。",
      official: ph("c5o", 3, 25, ["公式"]), sensor: true, plan: "sensor",
    },
  },
  { id: "m1", name: "なかのしま現代アートギャラリー", cat: "museum", pos: [135.4930, 34.6915], tags: ["現代アート", "写真", "気軽に見る", "〜1,000円", "屋内"], photos: ph("m1", 3, 190) },
  { id: "y1", name: "中之島 水辺のライトアップ", cat: "night", pos: [135.5010, 34.6930], tags: ["水辺の夜景", "ライトアップ", "写真を撮る", "散歩しながら", "無料"], photos: ph("y1", 3, 230) },
  { id: "ev1", name: "中之島マルシェ", cat: "event", pos: [135.5040, 34.6925], tags: ["マルシェ", "フード系", "にぎやか", "ふらっと立ち寄りたい", "予約なしがいい"], photos: ph("ev1", 3, 60) },
  { id: "t1", name: "中之島公園 公衆トイレ", cat: "toilet", pos: [135.5075, 34.6927], tags: ["男女別", "多目的・バリアフリー", "おむつ交換台"], photos: [] },
  { id: "sea1", name: "天保山ハーバー", cat: "sea", pos: [135.4310, 34.6560], tags: ["海", "港", "夕日", "景色を見る"], photos: ph("sea1", 3, 200) },
];

/** デモ用のお店（課金店舗の例を含む）＋ osaka_spots.csv の実在のお店 */
export const SHOPS: Shop[] = [...DEMO_SHOPS, ...OSAKA_SHOPS];

export const shopById = (id: string) => SHOPS.find((s) => s.id === id);

export type Place = { name: string; pos: LngLat };

export const PLACES: Place[] = [
  { name: "中百舌鳥駅", pos: [135.5030, 34.5562] },
  { name: "梅田駅", pos: [135.4959, 34.7025] },
  { name: "中崎町駅", pos: [135.5050, 34.7070] },
  { name: "北浜駅", pos: [135.5068, 34.6915] },
  { name: "淀屋橋駅", pos: [135.5013, 34.6926] },
  { name: "なんば駅", pos: [135.5010, 34.6660] },
  { name: "天王寺駅", pos: [135.5133, 34.6466] },
  ...OSAKA_PLACES,
];

/** 御堂筋線 なかもず → 梅田 (approx.) */
export const MIDOSUJI: [number, number][] = [
  [135.5030, 34.5562], [135.5131, 34.5701], [135.5134, 34.5862], [135.5144, 34.6043],
  [135.5142, 34.6213], [135.5133, 34.6466], [135.5060, 34.6503], [135.4972, 34.6527],
  [135.5010, 34.6660], [135.5010, 34.6748], [135.5000, 34.6823], [135.5013, 34.6926],
  [135.4959, 34.7025],
];

/** hand-traced walking paths between demo points (keys "from>to") used when online routing is unavailable */
export const WALK_HINTS: Record<string, [number, number][]> = {
  "梅田駅>c1": [[135.4959, 34.7025], [135.4968, 34.7036], [135.4980, 34.7046], [135.4990, 34.7055], [135.4996, 34.7061]],
  "c1>c3": [[135.4996, 34.7061], [135.5004, 34.7064], [135.5018, 34.7066], [135.5030, 34.7069], [135.5041, 34.7072]],
  "c3>b1": [[135.5041, 34.7072], [135.5046, 34.7077], [135.5053, 34.7079], [135.5061, 34.7081]],
  "b1>p1": [[135.5061, 34.7081], [135.5066, 34.7068], [135.5070, 34.7040], [135.5074, 34.7005], [135.5078, 34.6975], [135.5082, 34.6950], [135.5086, 34.6928]],
  "c1>b1": [[135.4996, 34.7061], [135.5004, 34.7064], [135.5018, 34.7066], [135.5030, 34.7069], [135.5041, 34.7072], [135.5046, 34.7077], [135.5053, 34.7079], [135.5061, 34.7081]],
  "p1>北浜駅": [[135.5086, 34.6928], [135.5080, 34.6921], [135.5074, 34.6917], [135.5068, 34.6915]],
  "c5>北浜駅": [[135.5069, 34.6908], [135.5068, 34.6915]],
  "p1>c5": [[135.5086, 34.6928], [135.5080, 34.6920], [135.5074, 34.6913], [135.5069, 34.6908]],
};

/** 「行きたい場所・エリア」の候補（中心の座標つき） */
export const AREAS: { name: string; pos: LngLat }[] = [
  { name: "梅田", pos: [135.4959, 34.7025] },
  { name: "中崎町", pos: [135.5045, 34.7075] },
  { name: "中之島", pos: [135.5040, 34.6925] },
  { name: "難波・心斎橋", pos: [135.5013, 34.6659] },
  { name: "通天閣・天王寺", pos: [135.5135, 34.6466] },
  { name: "森之宮", pos: [135.5352, 34.6826] },
  { name: "杉本", pos: [135.5050, 34.5946] },
  { name: "中百舌鳥", pos: [135.5048, 34.5454] },
  { name: "大阪の海辺", pos: [135.4302, 34.6558] },
];
