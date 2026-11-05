import type { Trip, TripPhoto } from "../store";
import { WALK_HINTS, shopById } from "./spots";
import type { LngLat } from "../lib/geo";

/** サンプルの過去のおでかけ（マイページのカレンダー・記録の表示用） */
const day = (m: number, d: number, h = 13) => new Date(2026, m - 1, d, h).getTime();

const photosAt = (id: string, shopIds: string[], at: number, per = 2): TripPhoto[] =>
  shopIds.flatMap((sid, i) => {
    const s = shopById(sid)!;
    return Array.from({ length: per }, (_, k) => ({
      id: `${id}-${sid}-${k}`,
      hue: (s.photos[0]?.hue ?? 200) + k * 20,
      spot: s.name,
      pos: s.pos,
      visibility: "public" as const,
      at: at + i * 3600_000 + k * 600_000,
    }));
  });

const join = (...keys: string[]): LngLat[] =>
  keys.flatMap((k, i) => (i ? (WALK_HINTS[k] as LngLat[]).slice(1) : (WALK_HINTS[k] as LngLat[])));

function trip(id: string, title: string, at: number, shops: string[], path: LngLat[], published = false, per = 2): Trip {
  return {
    id, title, planned: path, walked: path, spots: shops.map((s) => ({ name: shopById(s)!.name, pos: shopById(s)!.pos, shopId: s })),
    visited: shops.map((s) => shopById(s)!.name), photos: photosAt(id, shops, at, per),
    startedAt: at, endedAt: at + 4 * 3600_000, xpGained: 0, published,
  };
}

export const PAST_TRIPS: Trip[] = [
  trip("past-1", "中崎町レトロ喫茶めぐり", day(11, 1), ["c1", "c3", "b1"], join("梅田駅>c1", "c1>c3", "c3>b1"), true, 3),
  trip("past-2", "中之島で夕日を待つ日", day(10, 26, 15), ["p1", "c5"], join("p1>c5"), false, 3),
  trip("past-3", "茶屋町スイーツ休日", day(10, 18), ["s1", "c1"], (WALK_HINTS["梅田駅>c1"] as LngLat[]), false, 2),
  trip("past-4", "古着と雑貨をさがす", day(10, 5), ["b1", "b2"], (WALK_HINTS["c3>b1"] as LngLat[]), false, 2),
];
