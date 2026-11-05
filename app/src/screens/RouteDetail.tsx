import { useNavigate, useParams } from "react-router-dom";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { FollowButton } from "../components/RouteCard";
import { Avatar, LvBadge, Photo, Top } from "../components/ui";
import { FEED, userById } from "../data/routes";
import { buildRoute } from "../lib/routing";
import { fmtDist } from "../lib/geo";
import { meUser, myRoutes } from "../lib/myRoutes";
import { theme, uid, useStore } from "../store";

export default function RouteDetail() {
  const { id } = useParams();
  const { s, set } = useStore();
  const nav = useNavigate();
  const th = theme(s);
  const r = [...myRoutes(s), ...FEED].find((x) => x.id === id);
  if (!r) return <div className="screen"><Top back /><p style={{ padding: 20 }}>ルートが見つかりません</p></div>;
  const u = r.userId === "me" ? meUser(s) : userById(r.userId)!;

  const trace = async () => {
    const spots = r.spots.map((x) => ({ name: x.name, pos: x.pos, shopId: x.shopId ?? x.name }));
    const built = await buildRoute(spots);
    set((x) => ({
      ...x,
      trip: {
        id: uid(), title: `${r.title}をなぞる`, planned: built.walk.length > 1 ? built.walk : r.path, spots: built.spots,
        walked: [], visited: [], photos: [], startedAt: Date.now(), tracing: r.id,
      },
    }));
    nav("/trip");
  };

  return (
    <div className="screen" style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "46%" }}>
        <MapView base={th.base} accent={th.accent} walked={r.path} fit={r.path} fitKey={r.id}
          photoPins={r.spots.map((x) => ({ pos: x.pos, label: x.name, hue: x.photos[0]?.hue ?? 200, img: x.photos[0]?.src?.startsWith("data:") ? x.photos[0].src : undefined }))}
          padding={{ top: 90, bottom: 40, left: 40, right: 40 }} />
      </div>
      <div className="float" style={{ left: 0, right: 0, top: 0 }}><Top back /></div>
      <div className="float" style={{ left: 0, right: 0, bottom: 0, top: "43%", background: "#fff", borderRadius: "28px 28px 0 0", overflowY: "auto", padding: "18px 20px 110px", boxShadow: "0 -10px 30px rgba(8,7,143,.12)" }}>
        <div className="row">
          <Avatar u={u} size={40} />
          <div className="grow">
            <div className="row" style={{ gap: 6 }}><b>@{u.id}</b><LvBadge lv={u.level} /></div>
            <div className="t-small t-muted">{r.area} ・ {fmtDist(r.distance)} ・ {r.spots.length}スポット</div>
          </div>
          {u.id !== "me" && <FollowButton u={u} />}
        </div>
        <h1 className="h-ja" style={{ fontSize: 22, margin: "14px 0 16px" }}>{r.title}</h1>
        <div className="col" style={{ gap: 18 }}>
          {r.spots.map((sp, i) => (
            <div key={i}>
              <div className="row" style={{ marginBottom: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 14, background: "var(--base)", color: "var(--accent)", fontFamily: "var(--en)", fontWeight: 900, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <b>{sp.name}</b>
              </div>
              <div className="hscroll">{sp.photos.map((p) => <Photo key={p.id} p={p} w={140} h={140} by={u.id} />)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="float" style={{ left: 16, right: 16, bottom: 20, zIndex: 12 }}>
        <button className="btn accent block glow" style={{ height: 58 }} onClick={trace}><Icon name="walk" />このルートをなぞる</button>
      </div>
    </div>
  );
}
