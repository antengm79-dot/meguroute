import type { LngLat } from "../lib/geo";
import { shopById, type Photo } from "./spots";

export type User = { id: string; name: string; level: number; frame: string; locked: boolean; hue: number };

export const USERS: User[] = [
  { id: "saki_osaka", name: "さき", level: 23, frame: "aurora", locked: false, hue: 330 },
  { id: "mio_walk", name: "みお", level: 12, frame: "gold", locked: true, hue: 160 },
  { id: "yuu_sweets", name: "ゆう", level: 7, frame: "pink", locked: false, hue: 30 },
  { id: "nana.trip", name: "なな", level: 3, frame: "sky", locked: true, hue: 210 },
  { id: "rin_film", name: "りん", level: 15, frame: "gold", locked: false, hue: 270 },
];
export const userById = (id: string) => USERS.find((u) => u.id === id);

export type RouteSpot = { name: string; pos: LngLat; shopId?: string; photos: Photo[] };

export type PublicRoute = {
  id: string;
  userId: string;
  title: string;
  area: string;
  date: string;
  path: LngLat[];
  spots: RouteSpot[];
  distance: number; // m
  likes: number;
  saves: number;
};

const sp = (id: string, n = 2): RouteSpot => {
  const s = shopById(id)!;
  return { name: s.name, pos: s.pos, shopId: id, photos: s.photos.slice(0, n) };
};

export const FEED: PublicRoute[] = [
  {
    id: "r-saki", userId: "saki_osaka", title: "中崎町カフェと古着めぐり", area: "梅田・中崎町", date: "11/2",
    path: [[135.4959, 34.7025], [135.4996, 34.7061], [135.5041, 34.7072], [135.5061, 34.7081], [135.5058, 34.7066]],
    spots: [sp("c1"), sp("c3"), sp("b1"), sp("s2")], distance: 2400, likes: 1290, saves: 412,
  },
  {
    id: "r-mio", userId: "mio_walk", title: "中之島から川沿いの夕日へ", area: "中之島・北浜", date: "10/30",
    path: [[135.5013, 34.6926], [135.5040, 34.6925], [135.5086, 34.6928], [135.5098, 34.6936], [135.5069, 34.6908]],
    spots: [sp("ev1"), sp("p1"), sp("r1"), sp("c5")], distance: 3100, likes: 964, saves: 288,
  },
  {
    id: "r-yuu", userId: "yuu_sweets", title: "雨の日の茶屋町スイーツ", area: "梅田・茶屋町", date: "10/28",
    path: [[135.4959, 34.7025], [135.4983, 34.7057], [135.4996, 34.7061], [135.5015, 34.7035]],
    spots: [sp("s1"), sp("c1"), sp("i1")], distance: 1500, likes: 312, saves: 96,
  },
  {
    id: "r-rin", userId: "rin_film", title: "フィルムで撮る北区レトロ散歩", area: "中崎町・天満", date: "10/25",
    path: [[135.5005, 34.7010], [135.5041, 34.7072], [135.5056, 34.7074], [135.5049, 34.7085]],
    spots: [sp("j1"), sp("c3"), sp("h1"), sp("b2")], distance: 2000, likes: 701, saves: 233,
  },
  {
    id: "r-nana", userId: "nana.trip", title: "はじめての夜景さんぽ", area: "中之島", date: "10/20",
    path: [[135.4930, 34.6915], [135.5010, 34.6930], [135.5086, 34.6928]],
    spots: [sp("m1"), sp("y1"), sp("p1")], distance: 1800, likes: 54, saves: 12,
  },
];
