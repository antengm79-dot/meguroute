import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import { Photo, Top } from "../components/ui";
import { useStore, type TripPhoto } from "../store";

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function PhotoCalendar() {
  const { s } = useStore();
  const all = useMemo(() => {
    const list: (TripPhoto & { trip: string })[] = [];
    for (const t of [...(s.trip && !s.history.some((h) => h.id === s.trip!.id) ? [s.trip] : []), ...s.history])
      for (const p of t.photos) list.push({ ...p, at: p.at || t.startedAt, trip: t.title });
    return list.sort((a, b) => b.at - a.at);
  }, [s.history, s.trip]);
  const byDay = useMemo(() => {
    const m = new Map<string, typeof all>();
    for (const p of all) {
      const k = key(new Date(p.at));
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return m;
  }, [all]);

  const latest = all[0] ? new Date(all[0].at) : new Date();
  const [month, setMonth] = useState(new Date(latest.getFullYear(), latest.getMonth(), 1));
  const [day, setDay] = useState<string | null>(all[0] ? key(latest) : null);

  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => {
    const d = i - first + 1;
    return d >= 1 && d <= days ? new Date(month.getFullYear(), month.getMonth(), d) : null;
  });
  const sel = day ? byDay.get(day) ?? [] : [];
  const monthCount = all.filter((p) => { const d = new Date(p.at); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); }).length;

  return (
    <div className="screen">
      <Top back title="写真カレンダー" />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <button className="icon-btn" aria-label="前の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="back" /></button>
          <div style={{ textAlign: "center" }}>
            <div className="h-ja" style={{ fontSize: 20 }}>{month.getFullYear()}年{month.getMonth() + 1}月</div>
            <div className="t-small t-muted">この月の写真 {monthCount}枚</div>
          </div>
          <button className="icon-btn" aria-label="次の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="arrowR" /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 4 }}>
          {"日月火水木金土".split("").map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "#D6204A" : i === 6 ? "var(--base)" : "var(--muted)", padding: "4px 0" }}>{w}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = key(d);
            const ps = byDay.get(k);
            const on = day === k;
            return (
              <button key={i} onClick={() => ps && setDay(k)} disabled={!ps}
                style={{ aspectRatio: "1", maxWidth: "100%", border: on ? "2.5px solid var(--base)" : "1px solid var(--line)", borderRadius: 10, padding: 0, background: "#fff", position: "relative", overflow: "hidden" }}>
                {ps && <Photo p={ps[0]} w="100%" h="100%" r={0} style={{ position: "absolute", inset: 0 }} />}
                <span style={{ position: "absolute", left: 4, top: 3, fontSize: 11, fontWeight: 700, color: ps ? "#fff" : "var(--muted)", textShadow: ps ? "0 1px 3px rgba(0,0,0,.5)" : "none" }}>{d.getDate()}</span>
                {ps && ps.length > 1 && <span className="lv" style={{ position: "absolute", right: 2, bottom: 2, height: 16, padding: "0 5px", fontSize: 9, background: "var(--base)" }}>{ps.length}</span>}
              </button>
            );
          })}
        </div>

        {sel.length > 0 && (
          <>
            <div className="row between" style={{ margin: "20px 0 10px" }}>
              <h2 className="h-ja" style={{ fontSize: 17 }}>{new Date(sel[0].at).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</h2>
              <span className="tag">{sel[0].trip}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 6 }}>
              {sel.map((p) => (
                <Photo key={p.id} p={p} h={110} r={12}>
                  <span style={{ position: "absolute", left: 6, bottom: 6, right: 6, fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.spot}</span>
                  <span style={{ position: "absolute", right: 6, top: 6, fontSize: 9, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{new Date(p.at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
                </Photo>
              ))}
            </div>
          </>
        )}
        {!all.length && <p className="t-muted" style={{ textAlign: "center", marginTop: 20 }}>まだ写真がありません</p>}
      </div>
    </div>
  );
}
