import { Navigate, useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { Top } from "../components/ui";
import { catOf } from "../data/categories";
import { dist, fmtDist, lineLength } from "../lib/geo";
import { theme, useStore, type TripSpot } from "../store";

const STAY: Record<string, number> = { cafe: 60, shopping: 50, park: 40, sweets: 30, gourmet: 60, river: 30, museum: 60 };

export function timeline(spots: TripSpot[], start: string) {
  let [h, m] = start.split(":").map(Number);
  let t = h * 60 + m;
  const fmt = (x: number) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}`;
  return spots.map((sp, i) => {
    if (i > 0) {
      const prev = spots[i - 1];
      const d = dist(prev.pos, sp.pos);
      t += d > 3000 ? 35 : (d * 1.3) / 70;
    }
    const arrive = t;
    const stay = sp.cat ? STAY[sp.cat] ?? 40 : 0;
    t += stay;
    return { ...sp, at: fmt(arrive), stay, train: i > 0 && dist(spots[i - 1].pos, sp.pos) > 3000 };
  });
}

export default function RoutePreview() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const th = theme(s);
  const trip = s.trip;
  if (!trip) return <Navigate to="/plan" replace />;
  const tl = timeline(trip.spots, s.plan.start.time);
  const fitPts = trip.planned.length ? trip.planned : trip.spots.map((x) => x.pos);

  const start = () => {
    set((x) => ({ ...x, trip: x.trip && { ...x.trip, startedAt: Date.now(), walked: [] } }));
    nav("/trip");
  };

  return (
    <div className="screen" style={{ overflow: "hidden" }}>
      <MapView base={th.base} accent={th.accent} planned={trip.planned} train={trip.train} spots={trip.spots.filter((x) => x.shopId)}
        fit={fitPts} fitKey={trip.id} padding={{ top: 80, bottom: 500, left: 50, right: 50 }} />
      <div className="float" style={{ left: 0, right: 0, top: 0 }}><Top back /></div>
      <div className="sheet" style={{ animation: "none", maxHeight: "56%", paddingBottom: 100 }}>
        <div className="grab" />
        <div className="row" style={{ gap: 8 }}>
          <span className="h-en" style={{ fontSize: 11, color: "var(--base)" }}>AI Route</span>
          <span className="tag">{fmtDist(lineLength(trip.planned))} 徒歩</span>
          {trip.train && <span className="tag">電車 約35分</span>}
        </div>
        <h2 className="h-ja" style={{ fontSize: 21, margin: "8px 0 14px" }}>おすすめルートができました</h2>
        <div className="col" style={{ gap: 0 }}>
          {tl.map((sp, i) => (
            <div key={i} className="row" style={{ alignItems: "stretch", gap: 12 }}>
              <span style={{ width: 44, fontFamily: "var(--en)", fontWeight: 900, fontSize: 12, paddingTop: 4, color: "var(--base)" }}>{sp.at}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, marginTop: 5, background: sp.shopId ? "var(--base)" : "#fff", border: "3px solid var(--base)" }} />
                {i < tl.length - 1 && <span style={{ flex: 1, width: 3, background: tl[i + 1].train ? "repeating-linear-gradient(var(--base) 0 4px, transparent 4px 8px)" : "color-mix(in srgb, var(--base) 30%, transparent)" }} />}
              </div>
              <div className="grow" style={{ paddingBottom: 16 }}>
                <b>{sp.name}</b>
                <div className="t-small t-muted">
                  {sp.cat ? `${catOf(sp.cat).label} ・ ${sp.stay}分` : i === 0 ? "出発" : i === tl.length - 1 ? "到着" : tl[i].train ? "御堂筋線で移動" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="float" style={{ left: 16, right: 16, bottom: 20, zIndex: 45 }}>
        <button className="btn accent block glow" style={{ height: 60, fontSize: 17 }} onClick={start}>
          <Icon name="playtri" fill="currentColor" size={18} />旅をスタート
        </button>
      </div>
    </div>
  );
}
