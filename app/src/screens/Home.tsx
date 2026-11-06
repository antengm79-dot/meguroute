import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import ShopSheet from "../components/ShopSheet";
import Icon from "../components/Icon";
import { Logo } from "../components/ui";
import { SHOPS, type Shop } from "../data/spots";
import { defaultPlan, theme, uid, useStore } from "../store";
import { useGeo } from "../lib/useGeo";
import type { LngLat } from "../lib/geo";

export default function Home() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const th = theme(s);
  const geo = useGeo();
  const [shop, setShop] = useState<Shop | null>(null);
  const [poi, setPoi] = useState<{ name: string; pos: LngLat } | null>(null);
  const [centerKey, setCenterKey] = useState("init");

  const startFree = () => {
    set((x) => ({
      ...x,
      trip: {
        id: uid(), title: "ふらっとおでかけ", planned: [], spots: [], walked: geo.pos ? [geo.pos] : [],
        visited: [], photos: [], startedAt: Date.now(),
      },
    }));
    nav("/trip");
  };

  return (
    <div className="screen" style={{ overflow: "hidden" }}>
      <MapView
        base={th.base}
        accent={th.accent}
        zoom={16}
        center={[135.5025, 34.7055]}
        shops={SHOPS}
        onShop={setShop}
        onPoi={(name, pos) => setPoi({ name, pos })}
        me={geo.pos ? { pos: geo.pos, heading: geo.heading } : null}
        fit={geo.pos ? [geo.pos, [135.5061, 34.7081]] : undefined}
        fitKey={centerKey}
        padding={{ top: 140, bottom: 180, left: 60, right: 60 }}
      />

      <div className="float" style={{ left: 12, right: 12, top: 12 }}>
        <div className="row between" style={{ background: "rgba(255,255,255,.94)", borderRadius: 24, padding: "8px 8px 8px 16px", boxShadow: "0 8px 24px rgba(8,7,143,.12)", border: "1px solid var(--line)" }}>
          <Logo height={28} />
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn" aria-label="お知らせ" onClick={() => nav("/follow")}>
              <Icon name="bell" />
              {s.requests.length > 0 && <span className="badge">{s.requests.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <button className="icon-btn float" aria-label="現在地" style={{ right: 16, bottom: 150, boxShadow: "0 6px 18px rgba(8,7,143,.2)" }} onClick={() => setCenterKey(uid())}>
        <Icon name="locate" />
      </button>

      <div className="float" style={{ left: 16, right: 16, bottom: 16 }}>
        <div className="col" style={{ gap: 10 }}>
          <button className="btn accent block glow" style={{ height: 60, fontSize: 17 }} onClick={startFree}>
            <Icon name="playtri" fill="currentColor" size={18} />旅をスタート
          </button>
          <button className="btn block" onClick={() => { set((x) => ({ ...x, plan: { ...defaultPlan(), date: x.plan.date, mode: x.plan.mode }, answers: {} })); nav("/plan"); }}>
            <Icon name="sparkle" />ルートの計画
          </button>
        </div>
      </div>

      {shop && <ShopSheet shop={shop} onClose={() => setShop(null)} />}
      {poi && <ShopSheet poi={poi} onClose={() => setPoi(null)} />}
    </div>
  );
}
