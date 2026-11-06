import { useEffect, useRef, useState, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { Phone } from "../App";
import { StoreProvider, type State, type Trip } from "../store";
import StoreAdmin, { type StorePage } from "../store-admin/StoreAdmin";
import { MIDOSUJI, WALK_HINTS, shopById } from "../data/spots";
import type { LngLat } from "../lib/geo";
import "./board.css";

/* ---------- demo states for each artboard ---------- */
const join = (...keys: string[]): LngLat[] =>
  keys.flatMap((k, i) => (i ? (WALK_HINTS[k] as LngLat[]).slice(1) : (WALK_HINTS[k] as LngLat[])));

function demoTrip(done: boolean): Trip {
  const walk = join("梅田駅>c1", "c1>b1", "b1>p1", "p1>北浜駅");
  const sp = (id: string) => ({ name: shopById(id)!.name, pos: shopById(id)!.pos, shopId: id, cat: shopById(id)!.cat });
  const spots = [{ name: "中百舌鳥駅", pos: MIDOSUJI[0] as LngLat }, { name: "梅田駅", pos: MIDOSUJI[MIDOSUJI.length - 1] as LngLat }, sp("c1"), sp("b1"), sp("p1"), { name: "北浜駅", pos: [135.5068, 34.6915] as LngLat }];
  const now = Date.now();
  return {
    id: done ? "demo-done" : "demo-trip",
    title: "喫茶ミナモからはじまる中之島さんぽ",
    planned: walk, train: MIDOSUJI as LngLat[], spots,
    walked: done ? walk : [], visited: done ? ["喫茶ミナモ", "古着屋 ROUTE", "中之島バラ園"] : [],
    photos: done
      ? ["c1", "c1", "b1", "b1", "p1", "p1"].map((id, i) => ({ id: "dp" + i, hue: (shopById(id)!.photos[0].hue + i * 17) % 360, spot: shopById(id)!.name, pos: shopById(id)!.pos, visibility: "public" as const, at: now - (6 - i) * 1200_000 }))
      : [],
    startedAt: now - (done ? 5 * 3600_000 : 0), endedAt: done ? now : undefined,
  };
}
const withTrip = (done: boolean) => (s: State): State => ({ ...s, trip: demoTrip(done) });
const withPublish = (s: State): State => ({ ...s, trip: { ...demoTrip(true), xpGained: 210 } });

type Board =
  | { kind: "phone"; title: string; route: string; seed?: (s: State) => State }
  | { kind: "store"; title: string; page: StorePage };

const ROWS: { title: string; boards: Board[] }[] = [
  {
    title: "ルートを決めて、出かける",
    boards: [
      { kind: "phone", title: "01 ホーム（マップ）", route: "/" },
      { kind: "phone", title: "08 ルートを決める", route: "/plan" },
      { kind: "phone", title: "08 質問（任意）", route: "/plan/questions" },
      { kind: "phone", title: "08 近くのお店", route: "/plan/results" },
      { kind: "phone", title: "08 おすすめルート", route: "/plan/route", seed: withTrip(false) },
    ],
  },
  {
    title: "きょうのおでかけを記録する",
    boards: [
      { kind: "phone", title: "02 旅の途中（ナビ・記録）", route: "/trip", seed: withTrip(false) },
      { kind: "phone", title: "03 スポットで撮影", route: "/camera?spot=喫茶ミナモ", seed: withTrip(false) },
      { kind: "phone", title: "04 旅の終了", route: "/trip/end", seed: withTrip(true) },
      { kind: "phone", title: "05・09 Vlog", route: "/vlog", seed: withTrip(true) },
      { kind: "phone", title: "10 ルートを公開", route: "/publish", seed: withPublish },
    ],
  },
  {
    title: "みんなのルート・マイページ",
    boards: [
      { kind: "phone", title: "06 みんなのルート", route: "/feed" },
      { kind: "phone", title: "07 ルートをなぞる", route: "/route/r-saki" },
      { kind: "phone", title: "11 マイページ", route: "/me" },
      { kind: "phone", title: "11 おでかけの記録（距離）", route: "/me/records?tab=distance" },
      { kind: "phone", title: "11 おでかけの記録（写真カレンダー）", route: "/me/records?tab=photos" },
      { kind: "phone", title: "12 着せ替え", route: "/dress" },
      { kind: "phone", title: "13 フォロー", route: "/follow" },
    ],
  },
  {
    title: "店舗向け管理画面（toB・課金店舗のみ）",
    boards: [
      { kind: "store", title: "14 ダッシュボード", page: "dash" },
      { kind: "store", title: "15 店舗情報・写真", page: "edit" },
      { kind: "store", title: "16 料金プラン", page: "plan" },
    ],
  },
];

const PW = 390, PH = 844, SW = 1280, SH = 900, GAP = 80, ROW_GAP = 220, LABEL = 44;

function Artboard({ b, x, y }: { b: Board; x: number; y: number }) {
  const [key, setKey] = useState(0);
  const w = b.kind === "phone" ? PW : SW;
  const h = b.kind === "phone" ? PH : SH;
  let body: ReactNode;
  if (b.kind === "phone") {
    body = (
      <StoreProvider persist={false} seed={b.seed}>
        <MemoryRouter initialEntries={[b.route]}>
          <Phone />
        </MemoryRouter>
      </StoreProvider>
    );
  } else {
    body = <div className="bd-store"><StoreAdmin initial={b.page} /></div>;
  }
  return (
    <div className="bd-board" style={{ left: x, top: y, width: w }}>
      <div className="bd-label">
        <span>{b.title}</span>
        <button onClick={() => setKey((k) => k + 1)} aria-label="最初の状態に戻す">リセット</button>
      </div>
      <div className={"bd-frame " + (b.kind === "phone" ? "phone" : "desktop")} style={{ width: w, height: h }} data-board>
        <div key={key} style={{ width: "100%", height: "100%" }}>{body}</div>
      </div>
    </div>
  );
}

export default function BoardView() {
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 40, y: 90, k: 0.42 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  // layout
  let y = 0;
  const placed: { b: Board; x: number; y: number }[] = [];
  const titles: { t: string; y: number }[] = [];
  let width = 0;
  for (const row of ROWS) {
    titles.push({ t: row.title, y });
    let x = 0;
    let rowH = 0;
    for (const b of row.boards) {
      placed.push({ b, x, y: y + 70 });
      const w = b.kind === "phone" ? PW : SW;
      x += w + GAP;
      rowH = Math.max(rowH, (b.kind === "phone" ? PH : SH) + LABEL);
    }
    width = Math.max(width, x);
    y += 70 + rowH + ROW_GAP;
  }

  const fit = () => {
    const el = wrap.current;
    if (!el) return;
    const k = Math.min(1, (el.clientWidth - 80) / width);
    setView({ x: 40, y: 90, k });
  };
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-board]") && !e.ctrlKey && !e.metaKey) return; // scroll inside a screen
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        setView((v) => {
          const k = Math.max(0.12, Math.min(2, v.k * Math.exp(-e.deltaY * 0.01)));
          return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k };
        });
      } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoom = (f: number) => {
    const el = wrap.current!;
    const mx = el.clientWidth / 2, my = el.clientHeight / 2;
    setView((v) => {
      const k = Math.max(0.12, Math.min(2, v.k * f));
      return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k };
    });
  };

  return (
    <div className="bd">
      <header className="bd-top">
        <img src="logo.png" alt="めぐる〜と" />
        <span className="bd-title">アプリ画面</span>
        <span className="bd-hint">ドラッグで移動 ・ Ctrl+スクロール（ピンチ）で拡大縮小 ・ 各画面はそのまま操作できます</span>
        <div className="bd-zoom">
          <button onClick={() => zoom(1 / 1.25)} aria-label="縮小">−</button>
          <span>{Math.round(view.k * 100)}%</span>
          <button onClick={() => zoom(1.25)} aria-label="拡大">＋</button>
          <button onClick={fit}>全体</button>
          <button onClick={() => setView({ x: 40, y: 90, k: 1 })}>100%</button>
        </div>
      </header>
      <div
        ref={wrap}
        className="bd-canvas"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("[data-board], button")) return;
          drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setView((v) => ({ ...v, x: d.vx + e.clientX - d.x, y: d.vy + e.clientY - d.y }));
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <div className="bd-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {titles.map((t) => <h2 key={t.t} className="bd-row-title" style={{ top: t.y }}>{t.t}</h2>)}
          {placed.map((p) => <Artboard key={p.b.title} {...p} />)}
        </div>
      </div>
    </div>
  );
}
