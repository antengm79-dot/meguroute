import { useState } from "react";
import RouteCard from "../components/RouteCard";
import { Top } from "../components/ui";
import { FEED, userById } from "../data/routes";
import { meUser, myRoutes } from "../lib/myRoutes";
import { useStore } from "../store";

export default function Feed() {
  const { s } = useStore();
  const [tab, setTab] = useState<"all" | "follow">("all");
  const me = meUser(s);
  const mine = myRoutes(s);
  const list = [...mine, ...FEED].filter((r) => tab === "all" || s.following.includes(r.userId));
  return (
    <div className="screen">
      <Top title={<div className="h-en" style={{ fontSize: 14, color: "var(--base)" }}>Routes</div>} />
      <div className="screen-pad" style={{ paddingTop: 0 }}>
        <h1 className="h-ja" style={{ fontSize: 26 }}>みんなのルート</h1>
        <div className="seg" style={{ margin: "14px 0 16px" }}>
          <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}><b>おすすめ</b></button>
          <button className={tab === "follow" ? "on" : ""} onClick={() => setTab("follow")}><b>フォロー中</b></button>
        </div>
        <div className="col" style={{ gap: 18 }}>
          {list.map((r) => <RouteCard key={r.id} r={r} u={r.userId === "me" ? me : userById(r.userId)!} />)}
          {!list.length && <p className="t-muted" style={{ textAlign: "center" }}>フォロー中の人のルートはまだありません</p>}
        </div>
      </div>
    </div>
  );
}
