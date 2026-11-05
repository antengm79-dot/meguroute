import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { useCrowd } from "../components/ShopSheet";
import { Logo, Photo, useToast } from "../components/ui";
import { shopById } from "../data/spots";
import { useStore } from "../store";

const SHOP_ID = "c1";
const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i);
// visitor prediction built from everyone's accumulated photos & visits (demo values)
const PRED = [6, 9, 14, 22, 27, 21, 16, 19, 24, 28, 18, 9];

function Dashboard() {
  const c = useCrowd(SHOP_ID);
  const now = new Date().getHours();
  const max = Math.max(...PRED);
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card">
        <div className="row between">
          <b className="row" style={{ gap: 6 }}><Icon name="sensor" size={18} style={{ color: "var(--base)" }} />店内人数</b>
          <span className="tag live">● ESP32 LIVE</span>
        </div>
        <div className="row" style={{ gap: 16, marginTop: 12 }}>
          <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 44, color: "var(--base)", lineHeight: 1 }}>{c.n}<span style={{ fontSize: 16 }}> / {c.cap}</span></div>
          <div className="grow">
            <b style={{ color: c.color }}>{c.label}</b>
            <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${c.ratio * 100}%`, background: c.color }} /></div>
            <div className="t-small t-muted" style={{ marginTop: 4 }}>3秒ごとに更新</div>
          </div>
        </div>
      </div>

      <div className="card">
        <b>来客予測（時間帯別）</b>
        <div className="t-small t-muted">みんなの蓄積データから予測</div>
        <svg viewBox="0 0 360 190" width="100%" role="img" aria-label="9時から20時までの時間帯別来客予測。ピークは18時ごろ" style={{ marginTop: 10 }}>
          {[0, 10, 20, 30].map((v) => (
            <g key={v}>
              <line x1="28" x2="356" y1={160 - (v / 30) * 140} y2={160 - (v / 30) * 140} stroke="var(--base)" strokeOpacity=".08" />
              <text x="22" y={164 - (v / 30) * 140} fontSize="9" textAnchor="end" fill="#5A5F82">{v}</text>
            </g>
          ))}
          {PRED.map((v, i) => {
            const h = (v / 30) * 140;
            const x = 34 + i * 27;
            const on = HOURS[i] === now;
            return (
              <g key={i}>
                <rect x={x} y={160 - h} width="19" height={h} rx="5" fill={on ? "var(--accent)" : "var(--base)"} stroke={on ? "var(--base)" : "none"} strokeWidth="2" opacity={v === max || on ? 1 : 0.75} />
                <text x={x + 9.5} y="176" fontSize="9" textAnchor="middle" fill="#5A5F82">{HOURS[i]}</text>
              </g>
            );
          })}
          <text x="356" y="188" fontSize="9" textAnchor="end" fill="#5A5F82">時</text>
        </svg>
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          <span className="tag">ピーク 18時ごろ</span>
          <span className="tag">空き時間 9〜11時・20時</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
        {[["2,480", "地図での表示"], ["312", "ルートに追加"], ["86", "みんなの写真"]].map(([v, l]) => (
          <div key={l} className="card" style={{ padding: "14px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 18, color: "var(--base)" }}>{v}</div>
            <div className="t-small t-muted">{l}</div>
          </div>
        ))}
      </div>
      <p className="t-small t-muted" style={{ margin: 0 }}>※ 数値はデモ用のサンプルです（今週）</p>
    </div>
  );
}

function Edit() {
  const { s, set } = useStore();
  const shop = shopById(SHOP_ID)!;
  const f = shop.featured!;
  const [toast, say] = useToast();
  const [form, setForm] = useState({ name: shop.name, hours: f.hours, holiday: f.holiday, genre: f.genre, menu: f.menu, intro: f.intro });
  const [official, setOfficial] = useState<{ id: string; hue: number; src?: string }[]>(f.official);
  const rec = s.recommended[SHOP_ID] ?? [];
  const toggleRec = (id: string) =>
    set((x) => {
      const cur = x.recommended[SHOP_ID] ?? [];
      return { ...x, recommended: { ...x.recommended, [SHOP_ID]: cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id] } };
    });
  const F = (k: keyof typeof form, label: string, area = false) => (
    <label className="col" style={{ gap: 6 }}>
      <b style={{ fontSize: 13 }}>{label}</b>
      {area ? (
        <textarea className="pill-input" style={{ height: 90, borderRadius: 18, padding: 14, resize: "none" }} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <input className="pill-input" style={{ height: 46 }} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      )}
    </label>
  );
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card col" style={{ gap: 12 }}>
        <b>基本情報</b>
        {F("name", "店名")}
        <div className="row" style={{ gap: 8 }}>{F("hours", "営業時間")}{F("holiday", "定休日")}</div>
        {F("genre", "ジャンル")}
        {F("menu", "提供メニュー")}
        {F("intro", "紹介文", true)}
      </div>
      <div className="card">
        <b>お店公式の写真</b>
        <div className="hscroll" style={{ marginTop: 10 }}>
          {official.map((p) => <Photo key={p.id} p={p} w={110} h={110} />)}
          <label style={{ width: 110, height: 110, borderRadius: 14, border: "2px dashed var(--line)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0, cursor: "pointer", color: "var(--base)", fontWeight: 700, fontSize: 12 }}>
            <Icon name="plus" />追加
            <input type="file" accept="image/*" hidden onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setOfficial((o) => [...o, { id: "up" + o.length, hue: 0, src: URL.createObjectURL(file) }]);
            }} />
          </label>
        </div>
      </div>
      <div className="card">
        <b>おすすめ写真をえらぶ</b>
        <div className="t-small t-muted">選んだ写真はお店の詳細で上位に表示されます</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 6, marginTop: 10 }}>
          {shop.photos.map((p) => {
            const on = rec.includes(p.id);
            return (
              <button key={p.id} onClick={() => toggleRec(p.id)} style={{ border: "none", padding: 0, background: "none", position: "relative" }}>
                <Photo p={p} h={96} r={12} by={p.by} style={{ outline: on ? "3px solid var(--base)" : "none", outlineOffset: -3 }} />
                {on && <span className="tag" style={{ position: "absolute", right: 6, top: 6, background: "var(--accent)", height: 20 }}>おすすめ</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button className="btn block" onClick={() => say("店舗情報を保存しました")}>保存する</button>
      {toast}
    </div>
  );
}

function Plans() {
  const plans = [
    { name: "スタンダード", price: "10,000", items: ["店舗情報の掲載", "お店公式の写真", "おすすめ写真の上位表示", "来客予測ダッシュボード", "地図・絞り込み検索でPR枠表示"], hot: false },
    { name: "混雑センサー付き", price: "15,000", items: ["スタンダードのすべて", "ESP32センサー設置", "混雑状況のリアルタイム表示", "店内人数のライブ表示"], hot: true },
  ];
  return (
    <div className="col" style={{ gap: 14 }}>
      {plans.map((p) => (
        <div key={p.name} className="card" style={{ border: p.hot ? "2.5px solid var(--base)" : undefined, position: "relative" }}>
          {p.hot && <span className="tag pr" style={{ position: "absolute", right: 14, top: 14 }}>Popular</span>}
          <b style={{ fontFamily: "var(--ja)", fontWeight: 400, fontSize: 18 }}>{p.name}</b>
          <div style={{ margin: "6px 0 12px" }}>
            <span style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 30, color: "var(--base)" }}>¥{p.price}</span>
            <span className="t-muted"> / 月</span>
          </div>
          <div className="col" style={{ gap: 6 }}>
            {p.items.map((i) => <div key={i} className="row" style={{ gap: 8, fontSize: 14 }}><Icon name="check" size={16} style={{ color: "var(--base)" }} />{i}</div>)}
          </div>
          {p.hot && <p className="t-small t-muted" style={{ margin: "10px 0 0" }}>おすすめ：有名店が集まる観光地にあり、まだ集客できていない・満席になりにくいお店</p>}
        </div>
      ))}
      <div className="card" style={{ background: "var(--soft)", border: "none" }}>
        <b>今後のプラン</b>
        <p className="t-small" style={{ margin: "6px 0 0", lineHeight: 1.7 }}>月2万円・3万円のプランで、より強いPR枠をご用意予定。AIルート生成で必ず提案されるようになります。</p>
      </div>
      <div className="card row" style={{ gap: 10 }}>
        <Icon name="calendar" style={{ color: "var(--base)" }} />
        <p className="t-small" style={{ margin: 0, lineHeight: 1.7 }}>店舗の課金はリリースから約2年後に開始します。それまでは店名とみんなの写真のみ表示されます。</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"dash" | "edit" | "plan">("dash");
  const shop = shopById(SHOP_ID)!;
  const tabs = [["dash", "ダッシュボード", "chart"], ["edit", "店舗情報", "edit"], ["plan", "料金プラン", "yen"]] as const;
  return (
    <div className="screen">
      <div className="top" style={{ background: "var(--base)", color: "#fff", paddingBottom: 14 }}>
        <button className="icon-btn" aria-label="戻る" style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff" }} onClick={() => nav("/me")}><Icon name="back" /></button>
        <div className="grow">
          <div className="h-en" style={{ fontSize: 10, color: "var(--accent)" }}>For Stores</div>
          <div style={{ fontFamily: "var(--ja)", fontSize: 17 }}>{shop.name}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "4px 8px" }}><Logo icon height={26} /></div>
      </div>
      <div className="seg" style={{ margin: "14px 16px", background: "#fff", border: "1px solid var(--line)" }}>
        {tabs.map(([k, l, ic]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} style={{ gap: 4, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}><Icon name={ic} size={15} />{l}</button>
        ))}
      </div>
      <div style={{ padding: "0 16px 40px" }}>
        {tab === "dash" ? <Dashboard /> : tab === "edit" ? <Edit /> : <Plans />}
      </div>
    </div>
  );
}
