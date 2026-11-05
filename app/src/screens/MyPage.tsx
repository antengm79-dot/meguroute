import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import RouteCard, { MiniRoute } from "../components/RouteCard";
import { Avatar, LvBadge, Top } from "../components/ui";
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

        <h2 className="h-ja" style={{ fontSize: 18, margin: "22px 0 10px" }}>累計記録</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
          {[
            [fmtDist(tot.meters), "歩いた距離", "/me/records?tab=distance", "walk"],
            [String(tot.spots), "スポット", "/me/records?tab=spots", "pin"],
            [String(tot.photos), "写真", "/me/photos", "camera"],
          ].map(([v, l, to, ic]) => (
            <button key={l} className="card" style={{ padding: "14px 6px", textAlign: "center" }} onClick={() => nav(to)}>
              <Icon name={ic} size={18} style={{ color: "var(--base)" }} />
              <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 18, color: "var(--base)" }}>{v}</div>
              <div className="t-small t-muted row" style={{ justifyContent: "center", gap: 2 }}>{l}<Icon name="arrowR" size={12} /></div>
            </button>
          ))}
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
