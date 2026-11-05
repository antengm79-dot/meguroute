import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FollowButton } from "../components/RouteCard";
import { Avatar, LvBadge, Top } from "../components/ui";
import Icon from "../components/Icon";
import { USERS, userById } from "../data/routes";
import { useStore } from "../store";

export default function Follow() {
  const { s, set } = useStore();
  const [q] = useSearchParams();
  const [tab, setTab] = useState<string>(q.get("tab") ?? "requests");
  const ids = tab === "requests" ? s.requests : tab === "followers" ? s.followers : tab === "following" ? s.following : USERS.map((u) => u.id);
  const list = ids.map(userById).filter(Boolean) as typeof USERS;

  return (
    <div className="screen">
      <Top back title="フォロー" />
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <div className="card row between" style={{ padding: 14 }}>
          <span className="row" style={{ gap: 8 }}><Icon name="lock" size={18} style={{ color: "var(--base)" }} /><b>鍵アカウント</b></span>
          <button aria-label="鍵アカウントの切り替え" onClick={() => set((x) => ({ ...x, locked: !x.locked }))}
            style={{ width: 54, height: 32, borderRadius: 16, border: "none", background: s.locked ? "var(--base)" : "var(--soft)", position: "relative", transition: "background .2s" }}>
            <span style={{ position: "absolute", top: 3, left: s.locked ? 25 : 3, width: 26, height: 26, borderRadius: 13, background: s.locked ? "var(--accent)" : "#fff", transition: "left .2s", boxShadow: "0 2px 6px rgba(0,0,0,.15)" }} />
          </button>
        </div>
        <p className="t-small t-muted" style={{ margin: "6px 4px 14px" }}>オンにすると、フォローは承認制になります</p>

        <div className="seg" style={{ marginBottom: 14 }}>
          {[["requests", `リクエスト${s.requests.length ? ` ${s.requests.length}` : ""}`], ["followers", "フォロワー"], ["following", "フォロー中"], ["find", "さがす"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} style={{ fontSize: 12, fontWeight: 700 }}>{l}</button>
          ))}
        </div>

        <div className="col" style={{ gap: 8 }}>
          {list.map((u) => (
            <div key={u.id} className="card row" style={{ padding: 12 }}>
              <Avatar u={u} size={40} />
              <div className="grow">
                <div className="row" style={{ gap: 6 }}><b>@{u.id}</b>{u.locked && <Icon name="lock" size={13} />}</div>
                <div className="row" style={{ gap: 6, marginTop: 2 }}><LvBadge lv={u.level} /><span className="t-small t-muted">{u.name}</span></div>
              </div>
              {tab === "requests" ? (
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn sm" style={{ height: 34, fontSize: 12 }}
                    onClick={() => set((x) => ({ ...x, requests: x.requests.filter((i) => i !== u.id), followers: [...x.followers, u.id] }))}>承認</button>
                  <button className="btn soft sm" style={{ height: 34, fontSize: 12 }}
                    onClick={() => set((x) => ({ ...x, requests: x.requests.filter((i) => i !== u.id) }))}>拒否</button>
                </div>
              ) : tab === "followers" ? (
                <button className="btn soft sm" style={{ height: 34, fontSize: 12 }} onClick={() => set((x) => ({ ...x, followers: x.followers.filter((i) => i !== u.id) }))}>削除</button>
              ) : (
                <FollowButton u={u} />
              )}
            </div>
          ))}
          {!list.length && <p className="t-muted" style={{ textAlign: "center" }}>{tab === "requests" ? "届いているリクエストはありません" : "まだいません"}</p>}
        </div>
      </div>
    </div>
  );
}
