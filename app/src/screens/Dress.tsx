import Icon from "../components/Icon";
import { MiniRoute } from "../components/RouteCard";
import { LvBadge, Top } from "../components/ui";
import { FRAMES, THEMES, frameById, levelOf } from "../data/themes";
import { FEED } from "../data/routes";
import { useStore } from "../store";

export default function Dress() {
  const { s, set } = useStore();
  const lv = levelOf(s.xp);
  const fr = frameById(s.frameId);
  return (
    <div className="screen">
      <Top back title="着せ替え" />
      <div className="screen-pad" style={{ paddingTop: 4, paddingBottom: 40 }}>
        {/* preview */}
        <div className="row" style={{ gap: 14, alignItems: "stretch" }}>
          <div className="framed" style={{ background: fr.css, width: 130, flexShrink: 0 }}>
            <div className="inner"><MiniRoute path={FEED[0].path} spots={FEED[0].spots.map((x) => x.pos)} h={170} /></div>
          </div>
          <div className="col grow" style={{ justifyContent: "center", gap: 10 }}>
            <button className="btn block">ボタン</button>
            <button className="btn accent block">アクセント</button>
            <div className="row" style={{ gap: 6 }}><LvBadge lv={lv} /><span className="t-small t-muted">現在のレベル</span></div>
          </div>
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "24px 0 4px" }}>テーマカラー</h2>
        <p className="t-small t-muted" style={{ margin: "0 0 12px" }}>アプリのボタンの色が変わります</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
          {THEMES.map((t) => {
            const on = s.themeId === t.id;
            return (
              <button key={t.id} onClick={() => set((x) => ({ ...x, themeId: t.id }))} className="row"
                style={{ padding: 10, borderRadius: 18, background: "#fff", border: on ? `2.5px solid ${t.base}` : "1.5px solid var(--line)", gap: 10, textAlign: "left" }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: t.base, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 8, background: t.accent, boxShadow: `0 0 8px ${t.accent}` }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }} className="grow">{t.name}</span>
                {on && <Icon name="check" size={18} style={{ color: t.base }} />}
              </button>
            );
          })}
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "26px 0 4px" }}>フチの色</h2>
        <p className="t-small t-muted" style={{ margin: "0 0 12px" }}>Vlogと公開ルートのフチに使われます。レベルで特別な色が解放されます</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
          {FRAMES.map((f) => {
            const locked = (f.minLevel ?? 0) > lv;
            const on = s.frameId === f.id;
            return (
              <button key={f.id} disabled={locked} onClick={() => set((x) => ({ ...x, frameId: f.id }))}
                style={{ border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 0 }}>
                <span style={{ width: 58, height: 58, borderRadius: 18, background: f.css, border: on ? "3px solid var(--base)" : "1.5px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {locked && <span style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(255,255,255,.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--base)" }}><Icon name="lock" size={20} /></span>}
                  {on && <Icon name="check" size={22} style={{ color: f.id === "white" ? "var(--base)" : "#fff" }} />}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{f.name}</span>
                {f.minLevel && <span className="t-small t-muted" style={{ fontSize: 10 }}>Lv.{f.minLevel}で解放</span>}
              </button>
            );
          })}
        </div>
        <div className="card" style={{ marginTop: 20, background: "var(--soft)", border: "none" }}>
          <b>レベルの色</b>
          <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <LvBadge lv={3} /><span className="t-small">Lv.1〜</span>
            <LvBadge lv={5} /><span className="t-small">Lv.5〜</span>
            <LvBadge lv={10} /><span className="t-small">Lv.10〜</span>
            <LvBadge lv={20} /><span className="t-small">Lv.20〜</span>
          </div>
        </div>
      </div>
    </div>
  );
}
