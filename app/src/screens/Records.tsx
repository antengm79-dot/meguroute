import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { MiniRoute } from "../components/RouteCard";
import { Top } from "../components/ui";
import { catOf } from "../data/categories";
import { SHOPS } from "../data/spots";
import { XP_RULE } from "../data/themes";
import { fmtDist } from "../lib/geo";
import { totals, tripLen } from "../lib/records";
import { useStore } from "../store";
import { LevelCard } from "./MyPage";
import { CalendarBody } from "./PhotoCalendar";

export default function Records() {
  const { s } = useStore();
  const [q] = useSearchParams();
  const pick = (v: string | null) => (v === "spots" || v === "photos" ? v : "distance");
  const [tab, setTab] = useState(pick(q.get("tab")));
  useEffect(() => setTab(pick(q.get("tab"))), [q]);
  const tot = totals(s.history);

  // distance by month (last 4 months)
  const now = new Date(Math.max(...s.history.map((t) => t.startedAt), Date.now()));
  const months = Array.from({ length: 4 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 3 + i, 1));
  const perMonth = months.map((m) => s.history.filter((t) => { const d = new Date(t.startedAt); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }).reduce((a, t) => a + tripLen(t), 0));
  const maxM = Math.max(1, ...perMonth);

  // spots
  const spotMap = new Map<string, { n: number; last: number; photos: number }>();
  for (const t of s.history)
    for (const v of t.visited) {
      const cur = spotMap.get(v) ?? { n: 0, last: 0, photos: 0 };
      spotMap.set(v, { n: cur.n + 1, last: Math.max(cur.last, t.startedAt), photos: cur.photos + t.photos.filter((p) => p.spot === v).length });
    }
  const spots = [...spotMap.entries()].sort((a, b) => b[1].last - a[1].last);

  return (
    <div className="screen">
      <Top back title="おでかけの記録" />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <div className="seg" style={{ marginBottom: 14 }}>
          <button className={tab === "distance" ? "on" : ""} onClick={() => setTab("distance")} style={{ gap: 4, fontWeight: 700, fontSize: 13 }}><Icon name="walk" size={15} />距離</button>
          <button className={tab === "spots" ? "on" : ""} onClick={() => setTab("spots")} style={{ gap: 4, fontWeight: 700, fontSize: 13 }}><Icon name="pin" size={15} />スポット</button>
          <button className={tab === "photos" ? "on" : ""} onClick={() => setTab("photos")} style={{ gap: 4, fontWeight: 700, fontSize: 13 }}><Icon name="calendar" size={15} />写真</button>
        </div>

        {tab === "photos" ? (
          <CalendarBody />
        ) : tab === "distance" ? (
          <div className="col" style={{ gap: 14 }}>
            <div className="card">
              <div className="t-small t-muted">これまでに歩いた距離</div>
              <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 34, color: "var(--base)" }}>{fmtDist(tot.meters)}</div>
              <div className="t-small t-muted">{tot.trips}回のおでかけ ・ 距離で {Math.round((tot.meters / 1000) * XP_RULE.perKm)}XP 獲得</div>
              <svg viewBox="0 0 320 130" width="100%" role="img" aria-label="月ごとの歩いた距離" style={{ marginTop: 12 }}>
                {perMonth.map((m, i) => {
                  const h = (m / maxM) * 90;
                  const x = 20 + i * 76;
                  return (
                    <g key={i}>
                      <rect x={x} y={100 - h} width="48" height={Math.max(2, h)} rx="8" fill={i === 3 ? "var(--accent)" : "var(--base)"} stroke="var(--base)" strokeWidth={i === 3 ? 2 : 0} />
                      <text x={x + 24} y={94 - h} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink)">{fmtDist(m)}</text>
                      <text x={x + 24} y="120" textAnchor="middle" fontSize="11" fill="#5A5F82">{months[i].getMonth() + 1}月</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {s.history.map((t) => (
              <div key={t.id} className="card row" style={{ padding: 10 }}>
                <div style={{ width: 84, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", flexShrink: 0 }}><MiniRoute path={t.walked.length > 1 ? t.walked : t.planned} h={64} w={84} /></div>
                <div className="grow">
                  <b style={{ fontSize: 14 }}>{t.title}</b>
                  <div className="t-small t-muted">{new Date(t.startedAt).toLocaleDateString("ja-JP")}</div>
                </div>
                <b style={{ fontFamily: "var(--en)", color: "var(--base)" }}>{fmtDist(tripLen(t))}</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            <div className="card">
              <div className="t-small t-muted">めぐったスポット</div>
              <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 34, color: "var(--base)" }}>{tot.spots}<span style={{ fontSize: 14 }}> か所</span></div>
              <div className="t-small t-muted">{spots.length}種類のスポット ・ スポットで {tot.spots * XP_RULE.perSpot}XP 獲得</div>
            </div>
            {spots.map(([name, v]) => {
              const shop = SHOPS.find((x) => x.name === name);
              return (
                <div key={name} className="card row" style={{ padding: 12 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 13, background: "var(--base)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={shop ? catOf(shop.cat).icon : "pin"} size={20} /></span>
                  <div className="grow">
                    <b style={{ fontSize: 14 }}>{name}</b>
                    <div className="t-small t-muted">最後に行った日 {new Date(v.last).toLocaleDateString("ja-JP")} ・ 写真{v.photos}枚</div>
                  </div>
                  <span className="tag">{v.n}回</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 18 }}><LevelCard /></div>
      </div>
    </div>
  );
}
