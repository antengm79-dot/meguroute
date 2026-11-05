import { useId } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { Avatar, LvBadge, Photo } from "./ui";
import { bounds, fmtDist, type LngLat } from "../lib/geo";
import { frameById } from "../data/themes";
import type { PublicRoute, User } from "../data/routes";
import { useStore } from "../store";

export function MiniRoute({ path, spots, h = 150 }: { path: LngLat[]; spots?: LngLat[]; h?: number }) {
  const W = 300;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (path.length < 2) return <div style={{ height: h }} />;
  const [[x0, y0], [x1, y1]] = bounds(path);
  const kx = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
  const pad = 24;
  const sc = Math.min((W - pad * 2) / ((x1 - x0) * kx || 1e-6), (h - pad * 2) / ((y1 - y0) || 1e-6));
  const ox = (W - (x1 - x0) * kx * sc) / 2, oy = (h - (y1 - y0) * sc) / 2;
  const P = ([x, y]: LngLat) => `${(ox + (x - x0) * kx * sc).toFixed(1)},${(oy + (y1 - y) * sc).toFixed(1)}`;
  const d = "M" + path.map(P).join(" L");
  return (
    <svg viewBox={`0 0 ${W} ${h}`} width="100%" height={h} role="img" aria-label="ルートの形" style={{ display: "block", background: "#fff" }}>
      <defs>
        <pattern id={"g" + uid} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="var(--base)" strokeOpacity=".09" /></pattern>
        <filter id={"b" + uid}><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <rect width={W} height={h} fill={`url(#g${uid})`} />
      <path d={d} stroke="var(--accent)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#b${uid})`} />
      <path d={d} stroke="var(--base)" strokeOpacity=".4" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="var(--accent)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {spots?.map((p, i) => {
        const [x, y] = P(p).split(",").map(Number);
        return <g key={i}><circle cx={x} cy={y} r="9" fill="#fff" stroke="var(--base)" strokeWidth="3" /><text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--base)" fontFamily="Unbounded">{i + 1}</text></g>;
      })}
    </svg>
  );
}

export function FollowButton({ u }: { u: User }) {
  const { s, set } = useStore();
  const following = s.following.includes(u.id);
  const requested = s.requested.includes(u.id);
  const label = following ? "フォロー中" : requested ? "リクエスト済み" : "フォロー";
  return (
    <button
      className={"btn sm " + (following || requested ? "soft" : "")}
      style={{ height: 34, padding: "0 14px", fontSize: 12 }}
      onClick={(e) => {
        e.stopPropagation();
        set((x) => {
          if (following) return { ...x, following: x.following.filter((i) => i !== u.id) };
          if (requested) return { ...x, requested: x.requested.filter((i) => i !== u.id) };
          return u.locked ? { ...x, requested: [...x.requested, u.id] } : { ...x, following: [...x.following, u.id] };
        });
      }}
    >
      {u.locked && !following && <Icon name="lock" size={12} />}
      {label}
    </button>
  );
}

export default function RouteCard({ r, u }: { r: PublicRoute; u: User }) {
  const { s, set } = useStore();
  const nav = useNavigate();
  const liked = s.liked.includes(r.id);
  const saved = s.saved.includes(r.id);
  const fr = frameById(u.frame);
  const toggle = (k: "liked" | "saved") => set((x) => ({ ...x, [k]: x[k].includes(r.id) ? x[k].filter((i) => i !== r.id) : [...x[k], r.id] }));
  return (
    <article className="framed" style={{ background: fr.css }}>
      <div className="inner">
        <div className="row" style={{ padding: "12px 12px 8px" }}>
          <Avatar u={u} size={36} />
          <div className="grow">
            <div className="row" style={{ gap: 6 }}><b style={{ fontSize: 14 }}>@{u.id}</b><LvBadge lv={u.level} /></div>
            <div className="t-small t-muted">{r.area} ・ {r.date}</div>
          </div>
          {u.id !== "me" && <FollowButton u={u} />}
        </div>
        <button onClick={() => nav(`/route/${r.id}`)} style={{ border: "none", padding: 0, background: "none", width: "100%", textAlign: "left" }}>
          <div style={{ padding: "0 12px 10px" }}><h3 className="h-ja" style={{ fontSize: 17 }}>{r.title}</h3></div>
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 4, padding: "0 12px" }}>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)" }}><MiniRoute path={r.path} spots={r.spots.map((x) => x.pos)} h={150} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {r.spots.flatMap((x) => x.photos.slice(0, 1)).slice(0, 4).map((p) => <Photo key={p.id} p={p} h={73} r={10} />)}
            </div>
          </div>
        </button>
        <div className="row" style={{ padding: "10px 14px 12px", gap: 16 }}>
          <button onClick={() => toggle("liked")} className="row" style={{ border: "none", background: "none", gap: 4, padding: 0, color: liked ? "#FF4D6D" : "var(--ink)", fontWeight: 700, fontSize: 13 }}>
            <Icon name="heart" size={20} fill={liked ? "#FF4D6D" : "none"} />{r.likes + (liked ? 1 : 0)}
          </button>
          <button onClick={() => toggle("saved")} className="row" style={{ border: "none", background: "none", gap: 4, padding: 0, color: saved ? "var(--base)" : "var(--ink)", fontWeight: 700, fontSize: 13 }}>
            <Icon name="bookmark" size={20} fill={saved ? "var(--base)" : "none"} />{saved ? "保存済み" : "保存"}
          </button>
          <span className="grow" />
          <span className="t-small t-muted">{fmtDist(r.distance)} ・ {r.spots.length}スポット</span>
        </div>
      </div>
    </article>
  );
}
