import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { LvBadge, PinChara } from "../components/ui";
import { fmtDist, lineLength, sliceTo, type LngLat } from "../lib/geo";
import { levelInfo, levelOf, tripXp } from "../data/themes";
import { theme, useStore } from "../store";

export default function TripEnd() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const th = theme(s);
  const trip = s.trip;
  const [drawn, setDrawn] = useState<LngLat[]>([]);
  const [phase, setPhase] = useState(0); // 0 drawing, 1 stats
  const once = useRef(false);

  const walked = trip?.walked.length && trip.walked.length > 1 ? trip.walked : trip?.planned ?? [];
  const len = lineLength(walked);
  const visited = trip?.visited.length ?? 0;
  const photos = trip?.photos.length ?? 0;
  const gained = trip?.xpGained ?? tripXp(len, visited, photos);
  const xpBefore = s.xp - (trip?.xpGained ? gained : 0);
  const lvBefore = levelOf(xpBefore);
  const lvAfter = levelOf(xpBefore + gained);

  useEffect(() => {
    if (!trip || once.current || trip.xpGained) return;
    once.current = true;
    set((x) => {
      if (!x.trip) return x;
      const t = { ...x.trip, xpGained: gained, endedAt: x.trip.endedAt ?? Date.now() };
      return { ...x, xp: x.xp + gained, trip: t, history: [t, ...x.history.filter((h) => h.id !== t.id)] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // draw the route in ~3s
  useEffect(() => {
    if (!trip) return;
    const t0 = performance.now() + 200;
    let raf = 0;
    let done: ReturnType<typeof setTimeout> | undefined;
    const step = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - t0) / 3000));
      const e = 1 - Math.pow(1 - k, 3);
      setDrawn(sliceTo(walked, len * e));
      if (k < 1) raf = requestAnimationFrame(step);
      else done = setTimeout(() => setPhase(1), 250);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); if (done) clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!trip) return <Navigate to="/" replace />;

  const mins = Math.max(1, Math.round(((trip.endedAt ?? Date.now()) - (trip.startedAt || Date.now())) / 60000));
  const unlocked = lvBefore < 10 && lvAfter >= 10 ? "ゴールド" : lvBefore < 20 && lvAfter >= 20 ? "オーロラ" : null;
  const xpNow = xpBefore + (phase ? gained : 0);
  const pins = trip.photos.map((p) => ({ pos: p.pos, label: p.spot, img: p.dataUrl, hue: p.hue }));

  return (
    <div className="screen" style={{ overflow: "hidden" }}>
      <MapView base={th.base} accent={th.accent} walked={drawn} fit={walked} fitKey={trip.id + "end"} photoPins={phase ? pins : []}
        padding={{ top: 120, bottom: 430, left: 50, right: 50 }} />
      <div className="float" style={{ left: 0, right: 0, top: 0, padding: "18px 20px", textAlign: "center" }}>
        <div className="h-en" style={{ fontSize: 13, color: "var(--base)" }}>Trip Complete</div>
        <h1 className="h-ja" style={{ fontSize: 26, marginTop: 4, textShadow: "0 0 10px #fff, 0 0 10px #fff" }}>おつかれさま！</h1>
      </div>

      <div className="float" style={{ left: 0, right: 0, bottom: 0, background: "#fff", borderRadius: "28px 28px 0 0", padding: "20px 20px 24px", boxShadow: "0 -10px 30px rgba(8,7,143,.12)", transform: phase ? "none" : "translateY(30%)", opacity: phase ? 1 : 0, transition: "all .5s cubic-bezier(.2,.9,.3,1)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
          {[
            [fmtDist(len), "歩いた距離"],
            [`${mins}分`, "おでかけ時間"],
            [String(visited), "スポット"],
            [String(photos), "写真"],
          ].map(([v, l]) => (
            <div key={l} style={{ background: "var(--soft)", borderRadius: 16, padding: "12px 4px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 17, color: "var(--base)" }}>{v}</div>
              <div className="t-small t-muted" style={{ fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 16, gap: 12 }}>
          <LvBadge lv={levelOf(xpNow)} />
          <div className="grow">
            <div className="progress xpbar"><div style={{ width: `${(levelInfo(xpNow).cur / levelInfo(xpNow).need) * 100}%` }} /></div>
          </div>
          <b style={{ fontFamily: "var(--en)", fontSize: 13, color: "var(--base)" }}>+{gained}XP</b>
        </div>
        {lvAfter > lvBefore && (
          <div className="row" style={{ marginTop: 12, background: "var(--base)", color: "#fff", borderRadius: 18, padding: "10px 14px", gap: 10 }}>
            <PinChara size={36} mood="wink" />
            <div className="grow">
              <b style={{ fontFamily: "var(--ja)", fontWeight: 400 }}>レベルアップ！ Lv.{lvBefore} → Lv.{lvAfter}</b>
              {unlocked && <div style={{ fontSize: 12, color: "var(--accent)" }}>{unlocked}のフチが解放されました</div>}
            </div>
          </div>
        )}

        <div className="col" style={{ marginTop: 16 }}>
          <button className="btn accent block glow" onClick={() => nav("/vlog")}><Icon name="video" />10秒Vlogをつくる</button>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn grow" onClick={() => nav("/publish")}><Icon name="share" size={18} />ルートを公開</button>
            <button className="btn ghost" onClick={() => { set((x) => ({ ...x, trip: undefined })); nav("/"); }}>ホームへ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
