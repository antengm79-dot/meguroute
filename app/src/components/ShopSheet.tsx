import { useEffect, useState } from "react";
import type { Shop } from "../data/spots";
import { catOf } from "../data/categories";
import { useStore } from "../store";
import Icon from "./Icon";
import { Photo, Sheet } from "./ui";

/** simulated live occupancy from the store's ESP32 sensor */
export function useCrowd(seed: string) {
  const base = (seed.charCodeAt(0) * 7 + seed.length * 13) % 20;
  const [n, setN] = useState(base + 6);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.max(2, Math.min(30, x + Math.round(Math.random() * 4 - 2)))), 3000);
    return () => clearInterval(t);
  }, []);
  const cap = 30;
  const ratio = n / cap;
  const label = ratio < 0.4 ? "空いています" : ratio < 0.75 ? "やや混雑" : "混雑";
  const color = ratio < 0.4 ? "#1E9E5A" : ratio < 0.75 ? "#E8A300" : "#D6204A";
  return { n, cap, ratio, label, color };
}

function Crowd({ id }: { id: string }) {
  const c = useCrowd(id);
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row between">
        <span className="row" style={{ gap: 6, fontWeight: 700, fontSize: 14 }}>
          <Icon name="sensor" size={18} style={{ color: "var(--base)" }} />混雑状況
        </span>
        <span className="tag live">● LIVE</span>
      </div>
      <div className="row" style={{ marginTop: 10, gap: 12 }}>
        <span style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 26, color: c.color }}>{Math.round(c.ratio * 100)}%</span>
        <div className="grow">
          <div style={{ fontWeight: 700, color: c.color }}>{c.label}</div>
          <div className="progress" style={{ marginTop: 6 }}>
            <div style={{ width: `${c.ratio * 100}%`, background: c.color }} />
          </div>
        </div>
      </div>
      <div className="t-small t-muted" style={{ marginTop: 8 }}>店内 {c.n}人 / {c.cap}席 ・ 混雑センサー設置店</div>
    </div>
  );
}

export default function ShopSheet({
  shop,
  poi,
  onClose,
  onPick,
  pickLabel = "ここにする",
}: {
  shop?: Shop;
  poi?: { name: string };
  onClose: () => void;
  onPick?: () => void;
  pickLabel?: string;
}) {
  const { s } = useStore();
  if (!shop && poi) {
    return (
      <Sheet onClose={onClose}>
        <h2 className="h-ja" style={{ fontSize: 22 }}>{poi.name}</h2>
        <div className="divider" />
        <div style={{ fontWeight: 700, marginBottom: 10 }}>みんなの写真</div>
        <div className="card" style={{ textAlign: "center", padding: 24, background: "var(--soft)", border: "none" }}>
          <Icon name="camera" size={28} style={{ color: "var(--base)" }} />
          <div style={{ fontWeight: 700, marginTop: 6 }}>まだ写真がありません</div>
          <div className="t-small t-muted">旅の途中で、最初の1枚を撮ってみよう</div>
        </div>
        {onPick && <button className="btn block" style={{ marginTop: 16 }} onClick={onPick}>{pickLabel}</button>}
      </Sheet>
    );
  }
  if (!shop) return null;
  const f = shop.featured;
  const rec = s.recommended[shop.id] ?? [];
  const photos = [...shop.photos].sort((a, b) => (rec.includes(b.id) ? 1 : 0) - (rec.includes(a.id) ? 1 : 0));
  return (
    <Sheet onClose={onClose}>
      <div className="row" style={{ gap: 6, marginBottom: 6 }}>
        {f && <span className="tag pr">PR</span>}
        <span className="tag">{f?.genre ?? catOf(shop.cat).label}</span>
      </div>
      <h2 className="h-ja" style={{ fontSize: 24 }}>{shop.name}</h2>

      {f && (
        <>
          <div className="hscroll" style={{ marginTop: 14 }}>
            {f.official.map((p) => (
              <Photo key={p.id} p={p} w={220} h={150} r={18}>
                <span className="tag" style={{ position: "absolute", left: 8, top: 8, background: "#fff" }}>公式</span>
              </Photo>
            ))}
          </div>
          <p style={{ margin: "12px 0", lineHeight: 1.7 }}>{f.intro}</p>
          <div className="col" style={{ gap: 8, fontSize: 14 }}>
            <div className="row"><Icon name="yen" size={18} style={{ color: "var(--base)" }} /><b style={{ width: 64 }}>価格帯</b>{f.price}</div>
            <div className="row"><Icon name="clock" size={18} style={{ color: "var(--base)" }} /><b style={{ width: 64 }}>営業時間</b>{f.hours}（定休 {f.holiday}）</div>
            <div className="row"><Icon name="cafe" size={18} style={{ color: "var(--base)" }} /><b style={{ width: 64 }}>メニュー</b><span className="grow">{f.menu}</span></div>
          </div>
          {f.sensor && <div style={{ marginTop: 14 }}><Crowd id={shop.id} /></div>}
        </>
      )}

      <div className="row between" style={{ margin: "18px 0 10px" }}>
        <b>みんなの写真</b>
        <span className="t-small t-muted">{photos.length}枚</span>
      </div>
      {photos.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 6 }}>
          {photos.map((p) => (
            <Photo key={p.id} p={p} h={110} r={12} by={p.by}>
              {rec.includes(p.id) && <span className="tag" style={{ position: "absolute", right: 6, top: 6, background: "var(--accent)", height: 20 }}>おすすめ</span>}
            </Photo>
          ))}
        </div>
      ) : (
        <div className="t-muted t-small">まだ写真がありません</div>
      )}
      {onPick && (
        <button className="btn block" style={{ marginTop: 18 }} onClick={onPick}>
          <Icon name="check" />{pickLabel}
        </button>
      )}
    </Sheet>
  );
}
