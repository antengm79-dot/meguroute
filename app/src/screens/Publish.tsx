import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { MiniRoute } from "../components/RouteCard";
import { Photo, PinChara, Top } from "../components/ui";
import { frameById } from "../data/themes";
import { useStore, type Visibility } from "../store";

export default function Publish() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const trip = s.trip ?? s.history[0];
  const [title, setTitle] = useState(trip?.title ?? "");
  const [vis, setVis] = useState<Visibility>("public");
  const [done, setDone] = useState(false);
  if (!trip) return <Navigate to="/" replace />;
  const path = trip.walked.length > 1 ? trip.walked : trip.planned;
  const fr = frameById(s.frameId);

  const publish = () => {
    set((x) => {
      const upd = (t: typeof trip) => (t.id === trip.id ? { ...t, title, published: vis !== "private" } : t);
      return { ...x, trip: x.trip && upd(x.trip), history: x.history.map(upd) };
    });
    setDone(true);
  };

  if (done)
    return (
      <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 30, textAlign: "center" }}>
        <PinChara size={110} mood="wink" />
        <div className="h-en" style={{ color: "var(--base)", fontSize: 13 }}>Published</div>
        <h1 className="h-ja" style={{ fontSize: 26 }}>ルートを公開しました！</h1>
        <p className="t-muted" style={{ margin: 0 }}>みんなのルートに表示されます</p>
        <button className="btn block" style={{ marginTop: 16 }} onClick={() => nav("/feed")}>みんなのルートを見る</button>
        <button className="btn soft block" onClick={() => { set((x) => ({ ...x, trip: undefined })); nav("/"); }}>ホームへ</button>
      </div>
    );

  return (
    <div className="screen">
      <Top back title="ルートを公開" />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <div className="framed" style={{ background: fr.css }}>
          <div className="inner">
            <MiniRoute path={path} h={180} />
            <div className="hscroll" style={{ padding: 10 }}>
              {trip.photos.slice(0, 8).map((p) => <Photo key={p.id} p={p} w={70} h={70} r={10} />)}
            </div>
          </div>
        </div>
        <p className="t-small t-muted" style={{ margin: "6px 4px 0" }}>フチの色は着せ替えから変えられます</p>

        <div className="field-label" style={{ marginTop: 20 }}>タイトル</div>
        <input className="pill-input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="field-label" style={{ marginTop: 20 }}>公開範囲</div>
        <div className="seg">
          {([["public", "全体", "globe"], ["friends", "友達", "users"], ["private", "自分のみ", "lock"]] as const).map(([k, l, ic]) => (
            <button key={k} className={vis === k ? "on" : ""} onClick={() => setVis(k)} style={{ gap: 6, fontWeight: 700 }}><Icon name={ic} size={16} />{l}</button>
          ))}
        </div>
        <button className="btn accent block glow" style={{ marginTop: 28, height: 58 }} onClick={publish}><Icon name="share" />公開する</button>
      </div>
    </div>
  );
}
