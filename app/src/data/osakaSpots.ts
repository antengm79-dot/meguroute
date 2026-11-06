// 大阪のお店・スポット（osaka_spots.csv）を地図用のデータに変換する
import csv from "./osaka_spots.csv?raw";
import type { LngLat } from "../lib/geo";
import type { Place, Shop } from "./spots";

type Row = { id: string; name: string; kind: string; area: string; where: string; lat: number; lng: number; address: string };

function parse(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).slice(1);
  return lines
    .map((line) => {
      const c = line.split(",");
      return { id: c[0], name: c[1], kind: c[2], area: c[3], where: c[4], lat: Number(c[5]), lng: Number(c[6]), address: c.slice(7).join(",") };
    })
    .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

// CSVのカテゴリ → アプリのカテゴリ
function catOf(r: Row): string {
  switch (r.kind) {
    case "カフェ": return "cafe";
    case "レストラン": return "gourmet";
    case "ラーメン": return "gourmet";
    case "スイーツ・パン": return "sweets";
    case "公園": return "park";
    case "海辺": return "sea";
    case "観光スポット": return /神社|大社|寺|不動|石守/.test(r.name) ? "shrine" : "photo";
    default: return "photo";
  }
}

// 質問の回答で絞り込めるよう、カテゴリから分かる範囲のタグだけ付ける
function tagsOf(r: Row): string[] {
  switch (r.kind) {
    case "カフェ": return ["コーヒー・紅茶", "おしゃべり", "屋内"];
    case "レストラン": return ["普通に食事", "屋内"];
    case "ラーメン": return ["麺類", "がっつり食べたい", "屋内"];
    case "スイーツ・パン": return /パン|ベーカリー|ブーランジェ|ブランジュリー|Bake|Baker/i.test(r.name) ? ["テイクアウト", "食べ歩き"] : ["ケーキ", "店内でゆっくり"];
    case "公園": return ["散歩", "のんびりする", "花・緑", "屋外", "無料"];
    case "海辺": return ["海", "景色を見る", "散歩する", "夕日", "屋外"];
    case "観光スポット": return /神社|大社|寺|不動/.test(r.name) ? ["お参り", "歴史・建築", "有名な場所", "屋外"] : ["風景", "建物・街並み", "SNSに投稿したい"];
    default: return [];
  }
}

const ROWS = parse(csv);
const isPlace = (r: Row) => r.kind === "キャンパス" || r.kind.startsWith("駅");

/** 実在のお店・スポット。店名・カテゴリ・住所だけを持つ（営業時間や混雑などは付けない） */
export const OSAKA_SHOPS: Shop[] = ROWS.filter((r) => !isPlace(r)).map((r) => ({
  id: "o" + r.id,
  name: r.name,
  cat: catOf(r),
  pos: [r.lng, r.lat] as LngLat,
  tags: tagsOf(r),
  photos: [],
  address: r.address,
  area: r.area,
}));

/** キャンパスや駅（出発地・到着地の候補） */
export const OSAKA_PLACES: Place[] = ROWS.filter(isPlace).map((r) => ({ name: r.name, pos: [r.lng, r.lat] as LngLat }));
