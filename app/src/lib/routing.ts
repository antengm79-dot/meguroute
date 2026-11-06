import { dist, type LngLat } from "./geo";
import { MIDOSUJI, WALK_HINTS } from "../data/spots";
import type { TripSpot } from "../store";

async function osrmFoot(a: LngLat, b: LngLat): Promise<LngLat[] | null> {
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    return j.routes?.[0]?.geometry?.coordinates ?? null;
  } catch {
    return null;
  }
}

function hint(from: TripSpot, to: TripSpot): LngLat[] | null {
  const k1 = `${from.shopId ?? from.name}>${to.shopId ?? to.name}`;
  if (WALK_HINTS[k1]) return WALK_HINTS[k1] as LngLat[];
  const k2 = `${to.shopId ?? to.name}>${from.shopId ?? from.name}`;
  if (WALK_HINTS[k2]) return [...(WALK_HINTS[k2] as LngLat[])].reverse();
  return null;
}

/** Build the walking path through all spots. If the start is far away, ride the subway first. */
export async function buildRoute(spots: TripSpot[]): Promise<{ walk: LngLat[]; train?: LngLat[]; spots: TripSpot[] }> {
  let list = [...spots];
  let train: LngLat[] | undefined;
  if (list.length >= 2 && dist(list[0].pos, list[1].pos) > 3000) {
    const line = MIDOSUJI as LngLat[];
    const umeda = line[line.length - 1];
    if (dist(list[0].pos, line[0]) < 2000 && dist(list[1].pos, umeda) < 2500) {
      // 中百舌鳥 → 梅田 は御堂筋線
      train = line;
      list = [list[0], { name: "梅田駅", pos: umeda }, ...list.slice(1)];
    } else {
      // それ以外は、出発地から最初のスポットまでを電車の区間として点線で結ぶ
      train = [list[0].pos, list[1].pos];
    }
  }
  const walkStart = train ? 1 : 0;
  const walk: LngLat[] = [];
  for (let i = walkStart; i < list.length - 1; i++) {
    const a = list[i], b = list[i + 1];
    let seg = hint(a, b);
    if (!seg && dist(a.pos, b.pos) < 6000) seg = await osrmFoot(a.pos, b.pos);
    if (!seg) seg = [a.pos, b.pos];
    if (walk.length) seg = seg.slice(1);
    walk.push(...seg);
  }
  return { walk, train, spots: list };
}
