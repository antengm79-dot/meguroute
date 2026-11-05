import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import ShopSheet from "../components/ShopSheet";
import { Photo, PinChara, Top } from "../components/ui";
import { catOf } from "../data/categories";
import { NEUTRAL } from "../data/questions";
import { SHOPS, shopById, type Shop } from "../data/spots";
import { buildRoute } from "../lib/routing";
import { uid, useStore, type TripSpot } from "../store";

export default function Results() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    Object.fromEntries(s.plan.stops.filter((x) => x.shopId).map((x) => [x.id, x.shopId!])),
  );
  const [detail, setDetail] = useState<{ shop: Shop; stopId: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const lists = useMemo(() => {
    const common = Object.entries(s.answers).filter(([k, v]) => k.startsWith("common:") && v && !NEUTRAL.has(v)).map(([, v]) => v);
    return s.plan.stops.map((st) => {
      if (st.kind === "place") return { st, items: [] as { shop: Shop; hit: string[] }[] };
      const want = [
        ...Object.entries(s.answers).filter(([k, v]) => k.startsWith(st.cat + ":") && v && !NEUTRAL.has(v)).map(([, v]) => v),
        ...common,
      ];
      const items = SHOPS.filter((x) => x.cat === st.cat)
        .map((shop) => ({ shop, hit: want.filter((w) => shop.tags.includes(w)) }))
        .sort((a, b) => b.hit.length + (b.shop.featured ? 0.5 : 0) - (a.hit.length + (a.shop.featured ? 0.5 : 0)));
      return { st, items };
    });
  }, [s.answers, s.plan.stops]);

  const ready = s.plan.stops.every((st) => chosen[st.id]);

  const decide = async () => {
    setBusy(true);
    const spots: TripSpot[] = [
      { name: s.plan.start.name, pos: s.plan.start.pos, time: s.plan.start.time },
      ...s.plan.stops.map((st) => {
        const sh = shopById(chosen[st.id])!;
        return { name: sh.name, pos: sh.pos, shopId: sh.id, cat: sh.cat };
      }),
      { name: s.plan.end.name, pos: s.plan.end.pos, time: s.plan.end.time },
    ];
    const r = await buildRoute(spots);
    const first = spots[1]?.name ?? "";
    set((x) => ({
      ...x,
      trip: {
        id: uid(), title: `${first}からはじまる${x.plan.area.split("・").pop()}さんぽ`,
        planned: r.walk, train: r.train, spots: r.spots, walked: [], visited: [], photos: [], startedAt: 0,
      },
    }));
    nav("/plan/route");
  };

  return (
    <div className="screen">
      <Top back title="おすすめのスポット" />
      <div className="screen-pad" style={{ paddingTop: 6 }}>
        <div className="row" style={{ gap: 12, marginBottom: 12 }}>
          <PinChara size={56} />
          <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.6 }}>近くのお店を見つけたよ！<br /><span className="t-muted" style={{ fontWeight: 400, fontSize: 13 }}>タップして写真をチェックしてね</span></p>
        </div>
        {lists.map(({ st, items }, idx) => {
          const label = st.kind === "category" ? catOf(st.cat!).label : st.name;
          const pick = chosen[st.id];
          return (
            <section key={st.id} style={{ marginTop: 18 }}>
              <div className="row" style={{ marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--en)", fontWeight: 900, color: "var(--base)" }}>{String(idx + 1).padStart(2, "0")}</span>
                <h2 className="h-ja grow" style={{ fontSize: 19 }}>{label}</h2>
                {pick && <span className="tag" style={{ background: "var(--accent)" }}><Icon name="check" size={14} />決定</span>}
              </div>
              {st.kind === "place" ? (
                <div className="card row"><Icon name="pin" style={{ color: "var(--base)" }} /><b>{st.name}</b></div>
              ) : (
                <div className="hscroll" style={{ paddingBottom: 8 }}>
                  {items.map(({ shop, hit }) => {
                    const on = pick === shop.id;
                    return (
                      <button key={shop.id} onClick={() => setDetail({ shop, stopId: st.id })}
                        style={{ width: 200, flexShrink: 0, textAlign: "left", padding: 0, borderRadius: 20, overflow: "hidden", background: "#fff", border: on ? "3px solid var(--base)" : shop.featured ? "2px solid color-mix(in srgb, var(--base) 45%, transparent)" : "1px solid var(--line)" }}>
                        <Photo p={shop.featured?.official[0] ?? shop.photos[0] ?? { hue: 220 }} h={120} r={0}>
                          {shop.featured && <span className="tag pr" style={{ position: "absolute", left: 8, top: 8 }}>PR</span>}
                          {on && <span className="tag" style={{ position: "absolute", right: 8, top: 8, background: "var(--accent)" }}>ここにする</span>}
                        </Photo>
                        <div style={{ padding: "10px 12px 12px" }}>
                          <b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shop.name}</b>
                          <div className="t-small t-muted" style={{ marginTop: 2 }}>
                            {shop.featured ? `${shop.featured.genre} ・ ${shop.featured.price}` : `みんなの写真 ${shop.photos.length}枚`}
                          </div>
                          <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 6, minHeight: 24 }}>
                            {hit.slice(0, 2).map((h) => <span key={h} className="tag" style={{ height: 22 }}>{h}</span>)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <div className="float" style={{ left: 16, right: 16, bottom: 20 }}>
        <button className="btn block glow" style={{ height: 60, fontSize: 17 }} disabled={!ready || busy} onClick={decide}>
          {busy ? "ルートを作成中…" : ready ? "決定してルートを作る" : `あと${s.plan.stops.filter((st) => !chosen[st.id]).length}か所えらんでね`}
        </button>
      </div>
      {detail && (
        <ShopSheet shop={detail.shop} onClose={() => setDetail(null)}
          onPick={() => { setChosen((c) => ({ ...c, [detail.stopId]: detail.shop.id })); setDetail(null); }} />
      )}
    </div>
  );
}
