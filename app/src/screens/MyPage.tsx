import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import RouteCard, { MiniRoute } from "../components/RouteCard";
import { Avatar, LvBadge, TabBar, Top } from "../components/ui";
import { FEED, userById } from "../data/routes";
import { XP_PER_LEVEL, levelOf } from "../data/themes";
import { fmtDist, lineLength } from "../lib/geo";
import { meUser } from "../lib/myRoutes";
import { useStore } from "../store";

export default function MyPage() {
  const { s } = useStore();
  const nav = useNavigate();
  const me = meUser(s);
  const lv = levelOf(s.xp);
  const total = s.history.reduce((a, t) => a + lineLength(t.walked.length > 1 ? t.walked : t.planned), 0) + 38200;
  const spots = s.history.reduce((a, t) => a + t.visited.length, 0) + 64;
  const photos = s.history.reduce((a, t) => a + t.photos.length, 0) + 212;
  const saved = FEED.filter((r) => s.saved.includes(r.id));

  return (
    <div className="screen">
      <Top
        title={<div className="h-en" style={{ fontSize: 14, color: "var(--base)" }}>My Page</div>}
        right={<button className="icon-btn" aria-label="着せ替え" onClick={() => nav("/dress")}><Icon name="gear" /></button>}
      />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <div className="card" style={{ textAlign: "center", paddingTop: 24 }}>
          <Avatar u={me} size={76} />
          <h1 className="h-ja" style={{ fontSize: 22, marginTop: 10 }}>{s.name}</h1>
          <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 6 }}>
            <LvBadge lv={lv} />
            {s.locked && <span className="tag"><Icon name="lock" size={12} />鍵アカウント</span>}
          </div>
          <div style={{ margin: "14px 10px 4px" }}>
            <div className="progress xpbar"><div style={{ width: `${((s.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }} /></div>
            <div className="t-small t-muted" style={{ marginTop: 6 }}>次のレベルまで {XP_PER_LEVEL - (s.xp % XP_PER_LEVEL)} XP{lv < 10 ? " ・ Lv.10でゴールド解放" : lv < 20 ? " ・ Lv.20でオーロラ解放" : ""}</div>
          </div>
          <div className="row" style={{ justifyContent: "center", gap: 28, marginTop: 14 }}>
            <button onClick={() => nav("/follow?tab=followers")} style={{ border: "none", background: "none" }}><b style={{ fontFamily: "var(--en)" }}>{s.followers.length}</b><div className="t-small t-muted">フォロワー</div></button>
            <button onClick={() => nav("/follow?tab=following")} style={{ border: "none", background: "none" }}><b style={{ fontFamily: "var(--en)" }}>{s.following.length}</b><div className="t-small t-muted">フォロー中</div></button>
          </div>
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "22px 0 10px" }}>累計記録</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
          {[[fmtDist(total), "歩いた距離"], [String(spots), "スポット"], [String(photos), "写真"]].map(([v, l]) => (
            <div key={l} className="card" style={{ padding: "14px 6px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--en)", fontWeight: 900, fontSize: 18, color: "var(--base)" }}>{v}</div>
              <div className="t-small t-muted">{l}</div>
            </div>
          ))}
        </div>

        <div className="col" style={{ marginTop: 16, gap: 8 }}>
          {[
            ["palette", "着せ替え", "テーマカラー・フチの色", "/dress"],
            ["users", "フォロー管理", s.requests.length ? `リクエスト ${s.requests.length}件` : "フォロー・フォロワー", "/follow"],
            ["store", "店舗管理画面（課金店舗向け）", "ダッシュボード・店舗情報・料金プラン", "/admin"],
          ].map(([ic, t, sub, to]) => (
            <button key={to} className="card row" style={{ padding: 14, textAlign: "left" }} onClick={() => nav(to)}>
              <span style={{ width: 40, height: 40, borderRadius: 13, background: "var(--base)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ic} size={20} /></span>
              <span className="grow"><b>{t}</b><br /><span className="t-small t-muted">{sub}</span></span>
              <Icon name="arrowR" size={18} />
            </button>
          ))}
        </div>

        <h2 className="h-ja" style={{ fontSize: 18, margin: "24px 0 10px" }}>過去のおでかけ</h2>
        {s.history.length ? (
          <div className="col" style={{ gap: 10 }}>
            {s.history.map((t) => (
              <div key={t.id} className="card row" style={{ padding: 10 }}>
                <div style={{ width: 96, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", flexShrink: 0 }}>
                  <MiniRoute path={t.walked.length > 1 ? t.walked : t.planned} h={72} />
                </div>
                <div className="grow">
                  <b style={{ fontSize: 14 }}>{t.title}</b>
                  <div className="t-small t-muted">{new Date(t.startedAt || Date.now()).toLocaleDateString("ja-JP")} ・ {fmtDist(lineLength(t.walked.length > 1 ? t.walked : t.planned))} ・ 写真{t.photos.length}枚</div>
                  <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <button className="btn soft sm" style={{ height: 30, fontSize: 12 }} onClick={() => nav(`/vlog?trip=${t.id}`)}><Icon name="video" size={14} />Vlog</button>
                    {t.published && <span className="tag">公開中</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="t-muted t-small">まだおでかけの記録がありません</p>
        )}

        <h2 className="h-ja" style={{ fontSize: 18, margin: "24px 0 10px" }}>保存したルート</h2>
        {saved.length ? (
          <div className="col" style={{ gap: 16 }}>{saved.map((r) => <RouteCard key={r.id} r={r} u={userById(r.userId)!} />)}</div>
        ) : (
          <p className="t-muted t-small">みんなのルートで「保存」したルートがここに並びます</p>
        )}
      </div>
      <TabBar />
    </div>
  );
}
