import { useState } from "react";
import Icon from "../components/Icon";
import { useCrowd } from "../components/ShopSheet";
import { Logo, Photo } from "../components/ui";
import { shopById } from "../data/spots";
import "./store-admin.css";

/** 店舗向け管理画面（toB・課金店舗のみ）— 見た目のモックです */
const SHOP_ID = "c1";
const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i);
const PRED = [6, 9, 14, 22, 27, 21, 16, 19, 24, 28, 18, 9];
const WEEK = [["月", 182], ["火", 0], ["水", 0], ["木", 204], ["金", 266], ["土", 418], ["日", 391]] as const;

export type StorePage = "dash" | "edit" | "plan";

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="sa-card sa-kpi">
      <div className="sa-row sa-muted"><Icon name={icon} size={16} />{label}</div>
      <div className="sa-num">{value}</div>
      <div className="sa-sub">{sub}</div>
    </div>
  );
}

function Dashboard() {
  const c = useCrowd(SHOP_ID);
  const now = 15;
  return (
    <>
      <div className="sa-grid4">
        <Kpi label="地図での表示" value="2,480" sub="先週比 +18%" icon="pin" />
        <Kpi label="ルートに追加" value="312" sub="先週比 +9%" icon="sparkle" />
        <Kpi label="来店（推定）" value="146" sub="写真・チェックインから推定" icon="users" />
        <Kpi label="みんなの写真" value="86" sub="今週あたらしく投稿" icon="camera" />
      </div>
      <div className="sa-grid-2-1">
        <div className="sa-card">
          <div className="sa-row sa-between">
            <div><b>来客予測（時間帯別）</b><div className="sa-muted sa-small">みんなの蓄積データから予測 ・ 今日</div></div>
            <div className="sa-row" style={{ gap: 6 }}><span className="sa-chip on">今日</span><span className="sa-chip">明日</span><span className="sa-chip">週末</span></div>
          </div>
          <svg viewBox="0 0 640 230" width="100%" role="img" aria-label="時間帯別の来客予測。ピークは18時ごろ" style={{ marginTop: 14 }}>
            {[0, 10, 20, 30].map((v) => (
              <g key={v}>
                <line x1="36" x2="630" y1={190 - v * 5.5} y2={190 - v * 5.5} stroke="#08078F" strokeOpacity=".08" />
                <text x="28" y={194 - v * 5.5} fontSize="11" textAnchor="end" fill="#5A5F82">{v}人</text>
              </g>
            ))}
            {PRED.map((v, i) => {
              const x = 48 + i * 49;
              const on = HOURS[i] === now;
              return (
                <g key={i}>
                  <rect x={x} y={190 - v * 5.5} width="34" height={v * 5.5} rx="7" fill={on ? "#A1F9A1" : "#08078F"} stroke="#08078F" strokeWidth={on ? 2 : 0} opacity={on ? 1 : 0.82} />
                  <text x={x + 17} y="210" fontSize="11" textAnchor="middle" fill="#5A5F82">{HOURS[i]}時</text>
                </g>
              );
            })}
          </svg>
          <div className="sa-row" style={{ gap: 8 }}><span className="sa-tag">ピーク 18時ごろ</span><span className="sa-tag">空き時間 9〜11時・20時</span><span className="sa-tag">雨の日は +12%</span></div>
        </div>
        <div className="sa-card">
          <div className="sa-row sa-between"><b className="sa-row" style={{ gap: 6 }}><Icon name="sensor" size={18} />店内人数</b><span className="sa-live">● ESP32 LIVE</span></div>
          <div className="sa-big" style={{ color: c.color }}>{c.n}<span>/ {c.cap}席</span></div>
          <b style={{ color: c.color }}>{c.label}</b>
          <div className="sa-bar"><div style={{ width: `${c.ratio * 100}%`, background: c.color }} /></div>
          <div className="sa-muted sa-small" style={{ marginTop: 8 }}>アプリ上で「{c.label}」と表示中 ・ 3秒ごとに更新</div>
          <div className="sa-divider" />
          <b>今週の来店（推定）</b>
          <div className="sa-week">
            {WEEK.map(([d, v]) => (
              <div key={d}><div className="sa-week-bar" style={{ height: `${(v / 420) * 70}px`, opacity: v ? 1 : 0.2 }} /><span>{d}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="sa-card">
        <b>最近みんなが撮った写真</b>
        <div className="sa-photos">
          {shopById(SHOP_ID)!.photos.map((p) => <Photo key={p.id} p={p} h={120} r={12} by={p.by} />)}
        </div>
      </div>
      <p className="sa-muted sa-small">※ 数値はデモ用のサンプルです</p>
    </>
  );
}

function Edit() {
  const shop = shopById(SHOP_ID)!;
  const f = shop.featured!;
  const [rec, setRec] = useState<string[]>([shop.photos[1].id, shop.photos[3].id]);
  return (
    <div className="sa-grid-2-1">
      <div className="sa-card sa-form">
        <b>基本情報</b>
        <label>店名<input defaultValue={shop.name} /></label>
        <div className="sa-grid2">
          <label>営業時間<input defaultValue={f.hours} /></label>
          <label>定休日<input defaultValue={f.holiday} /></label>
        </div>
        <div className="sa-grid2">
          <label>ジャンル<input defaultValue={f.genre} /></label>
          <label>価格帯<input defaultValue={f.price} /></label>
        </div>
        <label>提供メニュー<input defaultValue={f.menu} /></label>
        <label>紹介文<textarea rows={4} defaultValue={f.intro} /></label>
        <div className="sa-row" style={{ justifyContent: "flex-end", gap: 8 }}><button className="sa-btn ghost">プレビュー</button><button className="sa-btn">保存する</button></div>
      </div>
      <div className="sa-col">
        <div className="sa-card">
          <b>お店公式の写真</b>
          <div className="sa-grid3" style={{ marginTop: 10 }}>
            {f.official.map((p) => <Photo key={p.id} p={p} h={90} r={10} />)}
            <div className="sa-add"><Icon name="plus" />追加</div>
          </div>
        </div>
        <div className="sa-card">
          <b>おすすめ写真をえらぶ</b>
          <div className="sa-muted sa-small">選んだ写真はアプリのお店詳細で上位に表示されます</div>
          <div className="sa-grid3" style={{ marginTop: 10 }}>
            {shop.photos.map((p) => {
              const on = rec.includes(p.id);
              return (
                <button key={p.id} onClick={() => setRec(on ? rec.filter((x) => x !== p.id) : [...rec, p.id])} className={"sa-pick" + (on ? " on" : "")}>
                  <Photo p={p} h={90} r={10} by={p.by} />
                  {on && <span className="sa-tag sa-pick-tag">おすすめ</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Plans() {
  const plans = [
    { name: "スタンダード", price: "10,000", items: ["店舗情報の掲載", "お店公式の写真", "おすすめ写真の上位表示", "来客予測ダッシュボード", "地図・絞り込み検索でPR枠表示"], current: false },
    { name: "混雑センサー付き", price: "15,000", items: ["スタンダードのすべて", "ESP32センサーの設置", "混雑状況のリアルタイム表示", "店内人数のライブ表示"], current: true },
    { name: "プレミアム（予定）", price: "20,000〜30,000", items: ["より強いPR枠", "AIルート生成で必ず提案", "季節の特集ページに掲載"], current: false },
  ];
  return (
    <>
      <div className="sa-grid3">
        {plans.map((p) => (
          <div key={p.name} className={"sa-card sa-plan" + (p.current ? " current" : "")}>
            {p.current && <span className="sa-tag sa-plan-tag">ご契約中</span>}
            <div className="sa-plan-name">{p.name}</div>
            <div className="sa-plan-price">¥{p.price}<span> / 月</span></div>
            <div className="sa-col" style={{ gap: 8 }}>{p.items.map((i) => <div key={i} className="sa-row" style={{ gap: 8 }}><Icon name="check" size={16} />{i}</div>)}</div>
            <button className={"sa-btn" + (p.current ? " ghost" : "")} style={{ marginTop: "auto" }}>{p.current ? "契約内容を見る" : "このプランにする"}</button>
          </div>
        ))}
      </div>
      <div className="sa-card sa-row" style={{ gap: 12 }}>
        <Icon name="calendar" />
        <div>
          <b>課金開始の予定</b>
          <div className="sa-muted sa-small">店舗の課金はアプリのリリースから約2年後に開始します。それまでは店名とみんなの写真のみが表示されます。センサー付きプランは、有名店が集まる観光地にあり、まだ集客できていない・満席になりにくいお店におすすめです。</div>
        </div>
      </div>
    </>
  );
}

const NAV: { k: StorePage; label: string; icon: string }[] = [
  { k: "dash", label: "ダッシュボード", icon: "chart" },
  { k: "edit", label: "店舗情報・写真", icon: "edit" },
  { k: "plan", label: "料金プラン", icon: "yen" },
];

export default function StoreAdmin({ initial = "dash", onExit }: { initial?: StorePage; onExit?: () => void }) {
  const [page, setPage] = useState<StorePage>(initial);
  const shop = shopById(SHOP_ID)!;
  return (
    <div className="sa">
      <aside className="sa-side">
        <div className="sa-brand"><Logo height={30} /><span>for Stores</span></div>
        <nav>
          {NAV.map((n) => (
            <button key={n.k} className={page === n.k ? "on" : ""} onClick={() => setPage(n.k)}><Icon name={n.icon} size={18} />{n.label}</button>
          ))}
        </nav>
        {onExit && <button className="sa-exit" onClick={onExit}><Icon name="back" size={16} />アプリにもどる</button>}
      </aside>
      <main className="sa-main">
        <header className="sa-head">
          <div>
            <div className="sa-eyebrow">店舗管理</div>
            <h1>{NAV.find((n) => n.k === page)!.label}</h1>
          </div>
          <div className="sa-row" style={{ gap: 10 }}>
            <span className="sa-tag">混雑センサー付きプラン</span>
            <div className="sa-store"><span className="sa-store-icon"><Icon name="cafe" size={18} /></span><div><b>{shop.name}</b><div className="sa-muted sa-small">大阪市北区茶屋町</div></div></div>
          </div>
        </header>
        <div className="sa-body">{page === "dash" ? <Dashboard /> : page === "edit" ? <Edit /> : <Plans />}</div>
      </main>
    </div>
  );
}
