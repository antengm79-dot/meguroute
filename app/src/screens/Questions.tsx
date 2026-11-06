import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { PinChara } from "../components/ui";
import { catOf } from "../data/categories";
import { CATEGORY_QUESTIONS, COMMON_QUESTIONS, NEUTRAL } from "../data/questions";
import { useStore } from "../store";

const SUBS = ["ぴったりの場所を探すね！", "もうちょっと教えて！", "キミの好みに仕上げるね！"];

export default function Questions() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [common, setCommon] = useState<boolean | null>(null);

  const steps = useMemo(() => {
    const cats = [...new Set(s.plan.stops.filter((x) => x.kind === "category").map((x) => x.cat!))];
    const out: { key: string; cat?: string; q: string; options: string[]; n: number }[] = [];
    for (const c of cats) CATEGORY_QUESTIONS[c]?.forEach((q, n) => out.push({ key: `${c}:${n}`, cat: c, ...q, n }));
    return out;
  }, [s.plan.stops]);
  const commonSteps = COMMON_QUESTIONS.map((q, n) => ({ key: `common:${n}`, cat: undefined, ...q, n }));
  const all = common ? [...steps, ...commonSteps] : steps;
  const atCommonGate = i >= steps.length && common === null;
  const done = i >= all.length && !atCommonGate;

  if (done || (steps.length === 0 && common === false)) {
    return <Navigate to="/plan/results" replace />;
  }

  const cur = all[i];
  const total = common ? all.length : steps.length + 1;
  const pick = (opt: string) => {
    set((x) => ({ ...x, answers: { ...x.answers, [cur.key]: x.answers[cur.key] === opt ? "" : opt } }));
    setTimeout(() => setI((v) => v + 1), 220);
  };

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column" }}>
      <div className="top">
        <button className="icon-btn" aria-label="戻る" onClick={() => (i === 0 ? nav(-1) : (setI(i - 1), i - 1 < steps.length && setCommon(null)))}>
          <Icon name="back" />
        </button>
        <span style={{ fontFamily: "var(--en)", fontWeight: 900, letterSpacing: ".1em" }}>{Math.min(i + 1, total)} / {total}</span>
        <button className="btn accent sm" onClick={() => nav("/plan/results")}>スキップ</button>
      </div>
      <div style={{ padding: "4px 40px 0" }}>
        <div className="progress"><div style={{ width: `${(Math.min(i + 1, total) / total) * 100}%` }} /></div>
      </div>

      {atCommonGate ? (
        <div className="screen-pad col" style={{ gap: 18, paddingTop: 36 }}>
          <div className="row" style={{ gap: 14 }}>
            <PinChara size={92} mood="wink" />
            <div>
              <h2 className="h-ja" style={{ fontSize: 24 }}>ほかにも条件を<br />つける？</h2>
              <p className="t-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>予算・混雑・屋内外なども選べるよ</p>
            </div>
          </div>
          <button className="btn block" style={{ marginTop: 20 }} onClick={() => setCommon(true)}>くわしく答える（7問）</button>
          <button className="btn soft block" onClick={() => { setCommon(false); nav("/plan/results"); }}>このまま検索する</button>
        </div>
      ) : (
        <div className="screen-pad col" style={{ gap: 20, paddingTop: 28 }}>
          <div className="row" style={{ gap: 14, alignItems: "center" }}>
            <PinChara size={92} mood={i % 2 ? "wink" : "smile"} />
            <div className="grow">
              {cur.cat ? (
                <span className="tag" style={{ marginBottom: 6 }}>{catOf(cur.cat).label} ・ Q{cur.n + 1}</span>
              ) : (
                <span className="tag" style={{ marginBottom: 6 }}>共通の質問 ・ Q{cur.n + 1}</span>
              )}
              <h2 className="h-ja" style={{ fontSize: 24, marginTop: 6 }}>{cur.q}</h2>
              <p className="t-muted" style={{ margin: "6px 0 0", fontSize: 13 }}>{SUBS[i % 3]}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginTop: 8 }}>
            {cur.options.filter((o) => !NEUTRAL.has(o)).map((o) => {
              const on = s.answers[cur.key] === o;
              return (
                <button key={o} onClick={() => pick(o)}
                  style={{
                    minHeight: 64, borderRadius: 20, padding: "10px 12px", fontWeight: 700, fontSize: 15,
                    border: on ? "2px solid var(--base)" : "1.5px solid var(--line)",
                    background: on ? "var(--base)" : "#fff", color: on ? "#fff" : "var(--ink)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  {on && <Icon name="check" size={18} style={{ color: "var(--accent)" }} />}{o}
                </button>
              );
            })}
          </div>
          <button className="btn soft block" onClick={() => setI(i + 1)}>答えずに次へ</button>
        </div>
      )}
    </div>
  );
}
