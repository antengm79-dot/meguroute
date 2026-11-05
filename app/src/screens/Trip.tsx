import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import MapView, { type PhotoPin } from "../components/MapView";
import Icon from "../components/Icon";
import { Logo, Photo, PinChara, Sheet } from "../components/ui";
import { SHOPS, WALK_HINTS } from "../data/spots";
import { FEED, userById } from "../data/routes";
import { along, bearing, dist, fmtDist, lineLength, project, sliceTo, turnText, type LngLat } from "../lib/geo";
import { useGeo } from "../lib/useGeo";
import { theme, useStore } from "../store";

const FREE_PATH: LngLat[] = [
  ...(WALK_HINTS["梅田駅>c1"] as LngLat[]),
  ...(WALK_HINTS["c1>c3"] as LngLat[]).slice(1),
  ...(WALK_HINTS["c3>b1"] as LngLat[]).slice(1),
  ...(WALK_HINTS["b1>p1"] as LngLat[]).slice(1),
];

const SPEEDS = [0, 30, 70, 140];

function Clock({ from }: { from: number }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.max(0, Math.floor((Date.now() - from) / 1000));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s2 = sec % 60;
  return <>{h}:{String(m).padStart(2, "0")}:{String(s2).padStart(2, "0")}</>;
}

export default function Trip() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const th = theme(s);
  const trip = s.trip;
  const geo = useGeo(!s.demoWalk);

  const free = !trip?.planned.length;
  const walkPath = free ? FREE_PATH : trip!.planned;
  const train = free ? undefined : trip!.train;
  const full = useMemo(() => (train ? [...train, ...walkPath.slice(1)] : walkPath), [train, walkPath]);
  const trainLen = useMemo(() => (train ? lineLength(train) : 0), [train]);
  const total = useMemo(() => lineLength(full), [full]);

  // spots to visit along the path
  const stops = useMemo(() => {
    const base = free
      ? SHOPS.filter((x) => project(FREE_PATH, x.pos).off < 25).map((x) => ({ name: x.name, pos: x.pos, shopId: x.id }))
      : trip!.spots.filter((x) => x.shopId);
    return base.map((x) => ({ ...x, at: project(full, x.pos).d })).sort((a, b) => a.at - b.at);
  }, [free, trip, full]);

  const [d, setD] = useState(trip?.progress ?? 0);
  const [speed, setSpeed] = useState(2);
  const [ask, setAsk] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [follow, setFollow] = useState(true);
  const dRef = useRef(d);
  dRef.current = d;
  const visitedRef = useRef<string[]>(trip?.visited ?? []);

  // demo walking
  useEffect(() => {
    if (!s.demoWalk || ask || !SPEEDS[speed]) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const v = dRef.current < trainLen ? 2500 : SPEEDS[speed];
      const nd = Math.min(total, dRef.current + v * dt);
      dRef.current = nd;
      setD(nd);
      if (nd < total) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s.demoWalk, ask, speed, total, trainLen]);

  // real GPS → progress
  useEffect(() => {
    if (s.demoWalk || !geo.real || !geo.pos) return;
    const pr = project(full, geo.pos);
    if (pr.off < 80) setD(Math.max(dRef.current, pr.d));
  }, [geo.pos, geo.real, s.demoWalk, full]);

  const here = along(full, d);
  const me = !s.demoWalk && geo.real && geo.pos ? { pos: geo.pos, heading: geo.heading } : { pos: here.p, heading: here.heading };
  const walked = d > trainLen ? sliceTo(walkPath, d - trainLen) : [];
  const onTrain = d < trainLen;

  // arrival
  useEffect(() => {
    const next = stops.find((x) => !visitedRef.current.includes(x.name));
    if (!next || ask) return;
    if (Math.abs(d - next.at) < 12 || dist(me.pos, next.pos) < 25) {
      visitedRef.current = [...visitedRef.current, next.name];
      setAsk(next.name);
    }
  }, [d, stops, ask, me.pos]);

  // persist progress
  useEffect(() => {
    const t = setTimeout(() => {
      set((x) => (x.trip ? { ...x, trip: { ...x.trip, progress: dRef.current, walked: d > trainLen ? sliceTo(walkPath, d - trainLen) : [], visited: visitedRef.current } } : x));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(d / 20), ask]);

  if (!trip) return <Navigate to="/" replace />;

  const next = stops.find((x) => !visitedRef.current.includes(x.name));
  const toNext = next ? Math.max(0, next.at - d) : total - d;
  // next turn within 250m
  let turn: { m: number; text: string; delta: number } | null = null;
  if (!onTrain) {
    let acc = 0;
    const path = full;
    const start = here.i + 1;
    acc = dist(here.p, path[start] ?? here.p);
    for (let k = start; k < path.length - 1 && acc < 250; k++) {
      const b1 = bearing(path[k - 1], path[k]);
      const b2 = bearing(path[k], path[k + 1]);
      const delta = ((b2 - b1 + 540) % 360) - 180;
      if (Math.abs(delta) > 35 && dist(path[k], path[k + 1]) > 8) {
        turn = { m: acc, text: turnText(delta), delta };
        break;
      }
      acc += dist(path[k], path[k + 1]);
    }
  }

  const tracing = trip.tracing ? FEED.find((r) => r.id === trip.tracing) : undefined;
  const tracer = tracing && userById(tracing.userId);
  const pins: PhotoPin[] = trip.photos.map((p) => ({ pos: p.pos, label: p.spot, img: p.dataUrl, hue: p.hue }));

  const end = () => {
    set((x) => (x.trip ? { ...x, trip: { ...x.trip, walked: walked.length > 1 ? walked : x.trip.walked, endedAt: Date.now(), visited: visitedRef.current } } : x));
    nav("/trip/end");
  };

  return (
    <div className="screen" style={{ overflow: "hidden" }}>
      <MapView base={th.base} accent={th.accent} zoom={16.3} center={me.pos}
        planned={free ? undefined : trip.planned} train={train} walked={walked} ghost={tracing?.path}
        spots={free ? undefined : trip.spots.filter((x) => x.shopId)} visited={visitedRef.current}
        me={me} follow={follow} photoPins={pins} />

      {/* top */}
      <div className="float col" style={{ left: 12, right: 12, top: 12, gap: 8 }}>
        <div className="row between">
          <div style={{ background: "rgba(255,255,255,.94)", borderRadius: 18, padding: "6px 12px", border: "1px solid var(--line)" }}><Logo height={24} /></div>
          <div className="row" style={{ gap: 8, height: 38, padding: "0 14px", borderRadius: 19, background: "var(--base)", color: "#fff", fontWeight: 700, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
            記録中 <span style={{ fontFamily: "var(--en)", fontWeight: 900, letterSpacing: ".06em" }}><Clock from={trip.startedAt || Date.now()} /></span>
          </div>
        </div>

        {tracing && tracer && (
          <button onClick={() => setShowTrace(true)} className="row" style={{ border: "none", borderRadius: 18, padding: "10px 14px", background: "var(--accent)", color: "var(--base)", fontWeight: 700, fontSize: 14, boxShadow: "0 6px 18px rgba(8,7,143,.15)" }}>
            <Icon name="users" size={18} />@{tracer.id} さんのルートをなぞり中<Icon name="arrowR" size={16} style={{ marginLeft: "auto" }} />
          </button>
        )}

        {/* nav banner */}
        <div className="row" style={{ background: "var(--base)", color: "#fff", borderRadius: 22, padding: "12px 16px", gap: 14, boxShadow: "0 10px 26px rgba(8,7,143,.3)" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--accent)", color: "var(--base)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={onTrain ? "train" : "arrowUp"} size={26} stroke={2.6} style={{ transform: turn && !onTrain ? `rotate(${Math.max(-90, Math.min(90, turn.delta))}deg)` : undefined }} />
          </span>
          <div className="grow">
            {onTrain ? (
              <><div style={{ fontFamily: "var(--ja)", fontSize: 18 }}>御堂筋線で梅田へ</div><div style={{ fontSize: 12, opacity: .8 }}>{s.plan.start.name} → 梅田駅</div></>
            ) : turn ? (
              <><div style={{ fontFamily: "var(--ja)", fontSize: 18 }}>{fmtDist(turn.m)}先 {turn.text}</div><div style={{ fontSize: 12, opacity: .8 }}>{next ? `${next.name}まで ${fmtDist(toNext)}` : "ゴールまでもう少し"}</div></>
            ) : (
              <><div style={{ fontFamily: "var(--ja)", fontSize: 18 }}>{next ? "道なりにまっすぐ" : free ? "自由におさんぽ中" : "ゴール！"}</div><div style={{ fontSize: 12, opacity: .8 }}>{next ? `${next.name}まで ${fmtDist(toNext)}` : `${fmtDist(d - trainLen)} 歩きました`}</div></>
            )}
          </div>
        </div>
      </div>

      {/* demo control */}
      <div className="float row" style={{ right: 12, bottom: 220, gap: 6, flexDirection: "column" }}>
        <button className="icon-btn" aria-label="現在地に追従" style={{ background: follow ? "var(--base)" : "#fff", color: follow ? "#fff" : "var(--base)" }} onClick={() => setFollow(!follow)}>
          <Icon name="nav" size={18} />
        </button>
        {s.demoWalk && (
          <button className="icon-btn" aria-label="デモ速度" style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 11 }} onClick={() => setSpeed((speed + 1) % SPEEDS.length)}>
            {speed === 0 ? "||" : `×${speed}`}
          </button>
        )}
      </div>

      {/* bottom */}
      <div className="float" style={{ left: 0, right: 0, bottom: 0, background: "#fff", borderRadius: "28px 28px 0 0", padding: "16px 18px 24px", boxShadow: "0 -10px 30px rgba(8,7,143,.12)" }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="t-small t-muted" style={{ fontWeight: 700 }}>{next ? "次のスポット" : "おつかれさま！"}</div>
            <div className="h-ja" style={{ fontSize: 19 }}>{next?.name ?? trip.spots[trip.spots.length - 1]?.name ?? "おさんぽ中"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 18, color: "var(--base)" }}>{fmtDist(Math.max(0, d - trainLen))}</div>
            <div className="t-small t-muted">{visitedRef.current.length}/{stops.length} スポット ・ 写真{trip.photos.length}枚</div>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn grow" onClick={() => nav(`/camera?spot=${encodeURIComponent(next && dist(me.pos, next.pos) < 60 ? next.name : visitedRef.current[visitedRef.current.length - 1] ?? "おさんぽ")}`)}>
            <Icon name="camera" />撮影する
          </button>
          <button className="btn ghost" onClick={end}><Icon name="flag" size={18} />旅を終了</button>
        </div>
      </div>

      {ask && (
        <div className="modal-wrap">
          <div className="modal">
            <PinChara size={80} />
            <div className="h-en" style={{ fontSize: 12, color: "var(--base)", marginTop: 6 }}>Arrived</div>
            <h2 className="h-ja" style={{ fontSize: 22, margin: "6px 0 4px" }}>{ask}に<br />着きました！</h2>
            <p className="t-muted" style={{ margin: "0 0 18px" }}>写真を撮りますか？</p>
            <div className="col">
              <button className="btn block" onClick={() => { const n = ask; setAsk(null); nav(`/camera?spot=${encodeURIComponent(n)}`); }}><Icon name="camera" />撮影する</button>
              <button className="btn soft block" onClick={() => setAsk(null)}>あとで</button>
            </div>
          </div>
        </div>
      )}

      {showTrace && tracing && tracer && (
        <Sheet onClose={() => setShowTrace(false)}>
          <div className="t-small t-muted" style={{ fontWeight: 700 }}>@{tracer.id} さんのルート</div>
          <h2 className="h-ja" style={{ fontSize: 20, margin: "4px 0 14px" }}>{tracing.title}</h2>
          <div className="col" style={{ gap: 14 }}>
            {tracing.spots.map((sp, i) => (
              <div key={i}>
                <div className="row" style={{ marginBottom: 6 }}><span className="spot-pin" style={{ flexDirection: "row" }}><b>{i + 1}</b></span><b>{sp.name}</b></div>
                <div className="hscroll">{sp.photos.map((p) => <Photo key={p.id} p={p} w={130} h={130} by={tracer.id} />)}</div>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
