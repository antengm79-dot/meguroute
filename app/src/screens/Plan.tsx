import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { Sheet, Top } from "../components/ui";
import { CATEGORIES, catOf } from "../data/categories";
import { PLACES, SHOPS } from "../data/spots";
import { uid, useStore, type Plan as PlanT, type Stop } from "../store";

const MODES: { k: PlanT["mode"]; icon: string; label: string }[] = [
  { k: "walk", icon: "walk", label: "徒歩" },
  { k: "train", icon: "train", label: "電車" },
  { k: "bike", icon: "bike", label: "自転車" },
  { k: "car", icon: "car", label: "車" },
];

const fmtDate = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}(${"日月火水木金土"[dt.getDay()]})`;
};

function PlaceInput({ value, onPick, placeholder }: { value: string; onPick: (name: string, pos: [number, number]) => void; placeholder: string }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const all = [...PLACES, ...SHOPS.map((s) => ({ name: s.name, pos: s.pos }))];
  const hits = q ? all.filter((p) => p.name.includes(q)).slice(0, 5) : PLACES.slice(0, 5);
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        className="pill-input"
        value={q}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setQ(e.target.value)}
      />
      {open && hits.length > 0 && (
        <div className="card" style={{ position: "absolute", left: 0, right: 0, top: 56, zIndex: 30, padding: 6 }}>
          {hits.map((h) => (
            <button key={h.name} className="row" style={{ width: "100%", border: "none", background: "none", padding: "10px 12px", textAlign: "left" }}
              onMouseDown={() => { setQ(h.name); onPick(h.name, h.pos); setOpen(false); }}>
              <Icon name="pin" size={18} style={{ color: "var(--base)" }} />{h.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Plan() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const p = s.plan;
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState<number | null>(null);

  const upd = (fn: (p: PlanT) => PlanT) => set((x) => ({ ...x, plan: fn(x.plan) }));
  const move = (i: number, d: number) =>
    upd((pl) => {
      const st = [...pl.stops];
      const j = i + d;
      if (j < 0 || j >= st.length) return pl;
      [st[i], st[j]] = [st[j], st[i]];
      return { ...pl, stops: st };
    });
  const addStop = (st: Omit<Stop, "id">) => {
    upd((pl) => ({ ...pl, stops: [...pl.stops, { id: uid(), ...st }] }));
    setAdding(false);
    setQ("");
  };
  const hits = q ? SHOPS.filter((x) => x.name.includes(q) || catOf(x.cat).label.includes(q)).slice(0, 6) : [];

  return (
    <div className="screen">
      <Top title={<div className="h-en" style={{ fontSize: 14, color: "var(--base)" }}>Route Plan</div>} />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <h1 className="h-ja" style={{ fontSize: 26, marginBottom: 14 }}>どこをめぐる？</h1>

        <div className="card col" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 130 }}>
              <div className="field-label"><Icon name="calendar" size={18} />日付</div>
              <label style={{ position: "relative", display: "block" }}>
                <div className="pill-input row" style={{ justifyContent: "center", fontWeight: 700 }}>{fmtDate(p.date)}</div>
                <input type="date" value={p.date} onChange={(e) => upd((pl) => ({ ...pl, date: e.target.value }))}
                  style={{ position: "absolute", inset: 0, opacity: 0 }} aria-label="日付" />
              </label>
            </div>
            <div className="grow">
              <div className="field-label"><Icon name="walk" size={18} />移動手段</div>
              <div className="seg">
                {MODES.map((m) => (
                  <button key={m.k} className={p.mode === m.k ? "on" : ""} aria-label={m.label} onClick={() => upd((pl) => ({ ...pl, mode: m.k }))}>
                    <Icon name={m.icon} size={20} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="field-label"><Icon name="pin" size={18} />行きたい場所・エリア</div>
            <input className="pill-input" value={p.area} onChange={(e) => upd((pl) => ({ ...pl, area: e.target.value }))} />
          </div>
        </div>

        <div className="t-muted" style={{ margin: "22px 4px 10px", fontWeight: 700, fontSize: 14 }}>旅を詳しく設計する</div>

        <div className="card col" style={{ gap: 14 }}>
          {/* start */}
          <div>
            <div className="field-label"><Icon name="playtri" size={16} fill="var(--base)" />旅の出発地</div>
            <div className="row">
              <PlaceInput value={p.start.name} placeholder="出発地" onPick={(name, pos) => upd((pl) => ({ ...pl, start: { ...pl.start, name, pos } }))} />
              <input type="time" className="pill-input" style={{ width: 110, textAlign: "center" }} value={p.start.time} onChange={(e) => upd((pl) => ({ ...pl, start: { ...pl.start, time: e.target.value } }))} />
            </div>
          </div>

          {/* stops */}
          <div style={{ borderLeft: "3px dashed color-mix(in srgb, var(--base) 30%, transparent)", marginLeft: 8, paddingLeft: 14 }} className="col">
            <div className="field-label" style={{ marginBottom: 0 }}>経由地<span className="t-small t-muted" style={{ fontWeight: 400 }}>（ドラッグで並べ替え）</span></div>
            {p.stops.map((st, i) => {
              const label = st.kind === "category" ? catOf(st.cat!).label : st.name;
              const icon = st.kind === "category" ? catOf(st.cat!).icon : "pin";
              return (
                <div
                  key={st.id}
                  draggable
                  onDragStart={() => setDrag(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (drag !== null && drag !== i) move(drag, i - drag); setDrag(null); }}
                  className="row"
                  style={{ background: "var(--soft)", borderRadius: 18, padding: "6px 6px 6px 12px", gap: 8, opacity: drag === i ? 0.5 : 1 }}
                >
                  <Icon name="grip" size={18} style={{ color: "var(--muted)", cursor: "grab" }} />
                  <span style={{ width: 34, height: 34, borderRadius: 12, background: "var(--base)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={icon} size={18} />
                  </span>
                  <b className="grow" style={{ fontSize: 15 }}>{label}</b>
                  <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="上へ" onClick={() => move(i, -1)}><Icon name="up" size={16} /></button>
                  <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="下へ" onClick={() => move(i, 1)}><Icon name="down" size={16} /></button>
                  <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="削除" onClick={() => upd((pl) => ({ ...pl, stops: pl.stops.filter((x) => x.id !== st.id) }))}><Icon name="close" size={16} /></button>
                </div>
              );
            })}
            <button className="btn soft" style={{ height: 48 }} onClick={() => setAdding(true)}><Icon name="plus" />経由地を追加</button>
          </div>

          {/* end */}
          <div>
            <div className="field-label"><Icon name="flag" size={18} />旅の到着地</div>
            <div className="row">
              <PlaceInput value={p.end.name} placeholder="到着地" onPick={(name, pos) => upd((pl) => ({ ...pl, end: { ...pl.end, name, pos } }))} />
              <input type="time" className="pill-input" style={{ width: 110, textAlign: "center" }} value={p.end.time} onChange={(e) => upd((pl) => ({ ...pl, end: { ...pl.end, time: e.target.value } }))} />
            </div>
          </div>
        </div>

        <button className="btn block glow" style={{ marginTop: 22, height: 60, fontSize: 18 }} disabled={!p.stops.length} onClick={() => nav("/plan/questions")}>
          <Icon name="search" />検索
        </button>
      </div>

      {adding && (
        <Sheet onClose={() => setAdding(false)}>
          <h2 className="h-ja" style={{ fontSize: 20, marginBottom: 12 }}>経由地を追加</h2>
          <div className="row" style={{ background: "var(--soft)", borderRadius: 26, padding: "0 16px" }}>
            <Icon name="search" size={20} style={{ color: "var(--muted)" }} />
            <input className="pill-input" style={{ background: "none", paddingLeft: 8 }} placeholder="場所やお店の名前で検索" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          </div>
          {hits.length > 0 && (
            <div className="col" style={{ gap: 4, marginTop: 8 }}>
              {hits.map((h) => (
                <button key={h.id} className="row" style={{ border: "none", background: "none", padding: "10px 6px", textAlign: "left" }}
                  onClick={() => addStop({ kind: "place", shopId: h.id, name: h.name, pos: h.pos, cat: h.cat })}>
                  <Icon name={catOf(h.cat).icon} size={20} style={{ color: "var(--base)" }} />
                  <span className="grow"><b>{h.name}</b><br /><span className="t-small t-muted">{catOf(h.cat).label}</span></span>
                  <Icon name="plus" size={18} />
                </button>
              ))}
            </div>
          )}
          <div style={{ fontWeight: 700, margin: "18px 0 10px" }}>カテゴリから選ぶ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
            {CATEGORIES.map((c) => (
              <button key={c.key} onClick={() => addStop({ kind: "category", cat: c.key })}
                style={{ border: "1.5px solid var(--line)", background: "#fff", borderRadius: 18, padding: "12px 0 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ width: 42, height: 42, borderRadius: 14, background: "var(--base)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={c.icon} size={22} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
