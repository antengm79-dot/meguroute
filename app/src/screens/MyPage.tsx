import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import RouteCard, { MiniRoute } from "../components/RouteCard";
import { Avatar, LvBadge, Photo, Top } from "../components/ui";
import { FEED, userById } from "../data/routes";
import { levelInfo } from "../data/themes";
import { fmtDist } from "../lib/geo";
import { meUser, myRoutes } from "../lib/myRoutes";
import { totals, tripLen } from "../lib/records";
import { useStore } from "../store";

export function LevelCard() {
  const { s } = useStore();
  const li = levelInfo(s.xp);
  const next = li.lv + 1;
  const unlock = next === 10 ? "ゴールドのフチ" : next === 20 ? "オーロラのフチ" : li.lv < 10 ? `Lv.10でゴールド解放` : li.lv < 20 ? "Lv.20でオーロラ解放" : "";
  return (
    <div style={{ background: "var(--soft)", borderRadius: 18, padding: 14, textAlign: "left" }}>
      <div className="row between">
        <b style={{ fontFamily: "var(--ja)", fontWeight: 400, fontSize: 15 }}>Lv.{next}まで あと{li.toNext}XP</b>
        <span className="t-small t-muted" style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 11 }}>{li.cur}/{li.need}</span>
      </div>
      <div className="progress xpbar" style={{ marginTop: 8 }}><div style={{ width: `${(li.cur / li.need) * 100}%` }} /></div>
      <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <span className="tag">写真1枚 = 12XP</span>
        <span className="tag">スポット1か所 = 30XP</span>
        <span className="tag">1km = 10XP</span>
      </div>
      <div className="t-small t-muted" style={{ marginTop: 8 }}>
        あと写真{Math.ceil(li.toNext / 12)}枚、またはスポット{Math.ceil(li.toNext / 30)}か所でレベルアップ{unlock ? ` ・ ${unlock}` : ""}
      </div>
    </div>
  );
}

/** 今月の小さなカレンダー：おでかけした日に写真が入る */
function MiniCalendar({ onOpen }: { onOpen: () => void }) {
  const { s } = useStore();
  const photos = s.history.flatMap((t) => t.photos.map((p) => ({ ...p, at: p.at || t.startedAt })));
  const latest = photos.length ? new Date(Math.max(...photos.map((p) => p.at))) : new Date();
  const y = latest.getFullYear(), m = latest.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const byDay = new Map<number, (typeof photos)[number]>();
  for (const p of photos) {
    const d = new Date(p.at);
    if (d.getFullYear() === y && d.getMonth() === m && !byDay.has(d.getDate())) byDay.set(d.getDate(), p);
  }
  return (
    <button onClick={onOpen} style={{ border: "none", background: "none", padding: 0, textAlign: "left" }} aria-label="写真カレンダーを開く">
      <div className="row between" style={{ marginBottom: 8 }}>
        <b style={{ fontSize: 14 }}>{m + 1}月のおでかけ</b>
        <span className="t-small t-muted">{byDay.size}日 ・ 写真カレンダー ›</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 3 }}>
        {"日月火水木金土".split("").map((w) => <span key={w} style={{ textAlign: "center", fontSize: 9, color: "var(--muted)" }}>{w}</span>)}
        {Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => {
          const d = i - first + 1;
          if (d < 1 || d > days) return <span key={i} />;
          const p = byDay.get(d);
          return p ? (
            <Photo key={i} p={p} h={30} r={7}><span style={{ position: "absolute", left: 3, top: 1, fontSize: 9, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>{d}</span></Photo>
          ) : (
            <span key={i} style={{ height: 30, borderRadius: 7, background: "var(--soft)", fontSize: 9, color: "var(--muted)", padding: "1px 3px" }}>{d}</span>
          );
        })}
      </div>
    </button>
  );
}

export default function MyPage() {
  const { s } = useStore();
  const nav = useNavigate();
  const me = meUser(s);
  const tot = totals(s.history);
  const saved = FEED.filter((r) => s.saved.includes(r.id));
  const mine = myRoutes(s);

  return (
    <div className="screen">
      <Top
        title={<div className="h-en" style={{ fontSize: 14, color: "var(--base)" }}>My Page</div>}
        right={<button className="icon-btn" aria-label="着せ替え" onClick={() => nav("/dress")}><Icon name="gear" /></button>}
      />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <div className="card col" style={{ alignItems: "center", gap: 10, paddingTop: 22 }}>
          <Avatar u={me} size={76} />
          <h1 className="h-ja" style={{ fontSize: 22 }}>{s.name}</h1>
          <div className="row" style={{ gap: 8 }}>
            <LvBadge lv={me.level} />
            {s.locked && <span className="tag"><Icon name="lock" size={12} />鍵アカウント</span>}
          </div>
          <div className="row" style={{ gap: 28 }}>
            <button onClick={() => nav("/follow?tab=followers")} style={{ border: "none", background: "none" }}><b style={{ fontFamily: "var(--en)" }}>{s.followers.length}</b><div className="t-small t-muted">フォロワー</div></button>
            <button onClick={() => nav("/follow?tab=following")} style={{ border: "none", background: "none" }}><b style={{ fontFamily: "var(--en)" }}>{s.following.length}</b><div className="t-small t-muted">フォロー中</div></button>
            <div><b style={{ fontFamily: "var(--en)" }}>{mine.length}</b><div className="t-small t-muted">投稿</div></div>
          </div>
          <div style={{ alignSelf: "stretch" }}><LevelCard /></div>
        </div>

        <div className="row between" style={{ margin: "22px 0 10px" }}>
          <h2 className="h-ja" style={{ fontSize: 18 }}>おでかけの記録</h2>
          <button className="row" style={{ border: "none", background: "none", gap: 2, fontSize: 13, fontWeight: 700, color: "var(--base)" }} onClick={() => nav("/me/records?tab=distance")}>詳細を見る<Icon name="arrowR" size={14} /></button>
        </div>
        <div className="card col" style={{ gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
            {[
              [fmtDist(tot.meters), "歩いた距離", "distance", "walk"],
              [String(tot.spots), "スポット", "spots", "pin"],
              [String(tot.photos), "写真", "photos", "camera"],
            ].map(([v, l, tab, ic]) => (
              <button key={l} onClick={() => nav(`/me/records?tab=${tab}`)}
                style={{ border: "none", background: "var(--soft)", borderRadius: 16, padding: "12px 4px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Icon name={ic} size={18} style={{ color: "var(--base)" }} />
                <span style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 18, color: "var(--base)" }}>{v}</span>
                <span className="t-small t-muted">{l}</span>
              </button>
            ))}
          </div>
          <MiniCalendar onOpen={() => nav("/me/records?tab=photos")} />
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "24px 0 10px" }}>自分の投稿</h2>
        {mine.length ? (
          <div className="col" style={{ gap: 16 }}>{mine.map((r) => <RouteCard key={r.id} r={r} u={me} />)}</div>
        ) : (
          <p className="t-muted t-small">「みんなのルート」に公開したルートがここに並びます</p>
        )}

        <div className="col" style={{ marginTop: 20, gap: 8 }}>
          {[
            ["palette", "着せ替え", "テーマカラー・フチの色", "/dress"],
            ["users", "フォロー管理", s.requests.length ? `リクエスト ${s.requests.length}件` : "フォロー・フォロワー", "/follow"],
          ].map(([ic, t, sub, to]) => (
            <button key={to} className="card row" style={{ padding: 14, textAlign: "left" }} onClick={() => nav(to)}>
              <span style={{ width: 40, height: 40, borderRadius: 13, background: "var(--base)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ic} size={20} /></span>
              <span className="grow"><b>{t}</b><br /><span className="t-small t-muted">{sub}</span></span>
              <Icon name="arrowR" size={18} />
            </button>
          ))}
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "24px 0 10px" }}>過去のおでかけ</h2>
        <div className="col" style={{ gap: 10 }}>
          {s.history.map((t) => (
            <div key={t.id} className="card row" style={{ padding: 10 }}>
              <div style={{ width: 96, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", flexShrink: 0 }}>
                <MiniRoute path={t.walked.length > 1 ? t.walked : t.planned} h={72} w={96} />
              </div>
              <div className="grow">
                <b style={{ fontSize: 14 }}>{t.title}</b>
                <div className="t-small t-muted">{new Date(t.startedAt || Date.now()).toLocaleDateString("ja-JP")} ・ {fmtDist(tripLen(t))} ・ 写真{t.photos.length}枚</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="btn soft sm" style={{ height: 30, fontSize: 12 }} onClick={() => nav(`/vlog?trip=${t.id}`)}><Icon name="video" size={14} />Vlog</button>
                  {t.published && <span className="tag">公開中</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "24px 0 10px" }}>保存したルート</h2>
        {saved.length ? (
          <div className="col" style={{ gap: 16 }}>{saved.map((r) => <RouteCard key={r.id} r={r} u={userById(r.userId)!} />)}</div>
        ) : (
          <p className="t-muted t-small">みんなのルートで「保存」したルートがここに並びます</p>
        )}
      </div>
    </div>
  );
}
