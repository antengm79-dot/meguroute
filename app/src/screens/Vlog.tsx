import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { Photo, Top, useToast } from "../components/ui";
import { FRAMES, levelOf } from "../data/themes";
import { DURATION, H, W, frameColors, loadImg, render, type VlogShot } from "../lib/vlog";
import { fmtDist, lineLength } from "../lib/geo";
import { theme, useStore, type TripPhoto } from "../store";

export default function Vlog() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const th = theme(s);
  const [q] = useSearchParams();
  const trip = (q.get("trip") && s.history.find((h) => h.id === q.get("trip"))) || s.trip || s.history[0];
  const lv = levelOf(s.xp);
  const [toast, say] = useToast();

  const candidates: TripPhoto[] = useMemo(() => {
    if (!trip) return [];
    if (trip.photos.length) return trip.photos;
    const names = trip.visited.length ? trip.visited : trip.spots.filter((x) => x.shopId).map((x) => x.name);
    return names.map((n, i) => ({ id: "ph" + i, hue: (i * 47 + 200) % 360, spot: n, pos: [0, 0], visibility: "public", at: 0 }));
  }, [trip]);

  const [sel, setSel] = useState<string[]>(() => candidates.slice(0, 10).map((p) => p.id));
  const [playing, setPlaying] = useState(true);
  const [rec, setRec] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shots = useRef<VlogShot[]>([]);
  const logo = useRef<HTMLImageElement | undefined>(undefined);
  const frame = FRAMES.find((f) => f.id === s.frameId) ?? FRAMES[0];

  const opts = () => ({
    shots: shots.current,
    frame: frameColors(frame.css, th.accent),
    base: th.base,
    accent: th.accent,
    route: trip?.walked.length && trip.walked.length > 1 ? trip.walked : trip?.planned ?? [],
    date: new Date(trip?.startedAt || Date.now()).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }),
    stats: `${fmtDist(lineLength(trip?.walked.length ? trip.walked : trip?.planned ?? []))} ・ ${sel.length}スポット`,
    logo: logo.current,
  });

  useEffect(() => {
    let dead = false;
    (async () => {
      await Promise.all([
        document.fonts.load('48px "Dela Gothic One"'),
        document.fonts.load('900 24px "Unbounded"'),
        document.fonts.load('700 22px "Zen Kaku Gothic New"'),
      ]).catch(() => {});
      logo.current = await loadImg("logo.png");
      const list = sel.map((id) => candidates.find((c) => c.id === id)!).filter(Boolean);
      const imgs = await Promise.all(list.map((p) => loadImg(p.dataUrl)));
      if (!dead) shots.current = list.map((p, i) => ({ img: imgs[i], hue: p.hue, spot: p.spot }));
    })();
    return () => { dead = true; };
  }, [sel, candidates]);

  // preview loop
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let t0 = performance.now();
    const loop = (now: number) => {
      const t = ((now - t0) / 1000) % DURATION;
      render(ctx, t, opts());
      if (playing) raf = requestAnimationFrame(loop);
    };
    if (playing) raf = requestAnimationFrame(loop);
    else render(ctx, 1.2, opts());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, s.frameId, s.themeId, sel]);

  const toggle = (id: string) =>
    setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : x.length >= 10 ? (say("写真は最大10枚までです"), x) : [...x, id]));

  const exportVideo = async (share: boolean) => {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
    const mime = types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
    if (!mime) { say("このブラウザは動画の書き出しに未対応です"); return; }
    setRec(true);
    const stream = c.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<void>((r) => (mr.onstop = () => r()));
    mr.start();
    const t0 = performance.now();
    await new Promise<void>((res) => {
      const loop = (now: number) => {
        const t = (now - t0) / 1000;
        render(ctx, Math.min(t, DURATION - 0.01), opts());
        if (t < DURATION) requestAnimationFrame(loop); else res();
      };
      requestAnimationFrame(loop);
    });
    mr.stop();
    await done;
    setRec(false);
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    const file = new File([blob], `meguroute-vlog.${ext}`, { type: blob.type });
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "めぐる〜と Vlog" }).catch(() => {});
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      say("Vlogを保存しました");
    }
  };

  if (!trip) return <div className="screen"><Top back title="Vlog" /><p style={{ padding: 20 }}>まだ旅の記録がありません</p></div>;

  return (
    <div className="screen">
      <Top back title={<div className="h-en" style={{ fontSize: 14, color: "var(--base)", textAlign: "center" }}>Vlog</div>} />
      <div className="screen-pad" style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={() => setPlaying(!playing)} aria-label="再生・一時停止" style={{ border: "none", padding: 0, background: "none", position: "relative" }}>
            <canvas ref={canvas} width={W} height={H} style={{ width: 225, height: 400, borderRadius: 20, boxShadow: "0 16px 40px rgba(8,7,143,.25)", display: "block" }} />
            {!playing && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="playtri" size={48} fill="#fff" /></span>}
          </button>
        </div>
        <p className="t-small t-muted" style={{ textAlign: "center", margin: "8px 0 0" }}>縦型 9:16 ・ 約{DURATION}秒</p>

        <div className="row between" style={{ margin: "20px 0 10px" }}>
          <b>写真をえらぶ</b>
          <span className="t-small t-muted">{sel.length} / 10枚</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6 }}>
          {candidates.map((p) => {
            const n = sel.indexOf(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)} style={{ border: "none", padding: 0, background: "none", position: "relative" }}>
                <Photo p={p} h={84} r={12} style={{ outline: n >= 0 ? "3px solid var(--base)" : "none", outlineOffset: -3, opacity: n >= 0 ? 1 : 0.55 }} />
                {n >= 0 && <span className="lv" style={{ position: "absolute", top: 4, right: 4, background: "var(--base)" }}>{n + 1}</span>}
                <span style={{ position: "absolute", left: 4, bottom: 4, right: 4, fontSize: 9, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.spot}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontWeight: 700, margin: "20px 0 10px" }}>フチの色</div>
        <div className="hscroll" style={{ gap: 12 }}>
          {FRAMES.map((f) => {
            const locked = (f.minLevel ?? 0) > lv;
            const on = s.frameId === f.id;
            return (
              <button key={f.id} disabled={locked} onClick={() => set((x) => ({ ...x, frameId: f.id }))}
                style={{ border: "none", background: "none", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, opacity: locked ? 0.5 : 1 }}>
                <span style={{ width: 46, height: 46, borderRadius: 23, background: f.css, border: on ? "3px solid var(--base)" : "1.5px solid var(--line)", boxShadow: on ? "0 0 0 3px #fff inset" : undefined, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  {locked && <Icon name="lock" size={16} />}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{locked ? `Lv.${f.minLevel}` : f.name}</span>
              </button>
            );
          })}
        </div>

        <div className="col" style={{ marginTop: 22 }}>
          <button className="btn accent block glow" disabled={rec || !sel.length} onClick={() => exportVideo(true)}>
            <Icon name="share" />{rec ? "書き出し中…（約10秒）" : "SNSにシェア"}
          </button>
          <button className="btn ghost block" disabled={rec || !sel.length} onClick={() => exportVideo(false)}><Icon name="download" />端末に保存</button>
          <button className="btn soft block" onClick={() => nav("/publish")}>ルートを公開する</button>
        </div>
      </div>
      {toast}
    </div>
  );
}
