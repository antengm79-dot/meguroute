import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { Photo } from "../components/ui";
import { SHOPS } from "../data/spots";
import { uid, useStore, type TripPhoto, type Visibility } from "../store";
import type { LngLat } from "../lib/geo";

const VIS: { k: Visibility; label: string; icon: string }[] = [
  { k: "public", label: "全体", icon: "globe" },
  { k: "friends", label: "友達", icon: "users" },
  { k: "private", label: "自分のみ", icon: "lock" },
];

function shrink(src: CanvasImageSource, w: number, h: number, mirror = false): string {
  const max = 900;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const ctx = c.getContext("2d")!;
  if (mirror) {
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export default function Camera() {
  const { s, set } = useStore();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const spot = q.get("spot") || "おさんぽ";
  const video = useRef<HTMLVideoElement>(null);
  const [cam, setCam] = useState<"wait" | "on" | "off">("wait");
  const [vis, setVis] = useState<Visibility>("public");
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const shots = (s.trip?.photos ?? []).filter((p) => p.spot === spot);

  useEffect(() => {
    let stream: MediaStream | null = null;
    setCam((c) => (c === "on" ? "on" : "wait"));
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: false })
      .then((st) => {
        stream = st;
        if (video.current) {
          video.current.srcObject = st;
          video.current.play().catch(() => {});
        }
        setCam("on");
      })
      .catch(() => setCam("off"));
    if (!navigator.mediaDevices) setCam("off");
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [facing]);

  const pos = (): LngLat => {
    const sh = SHOPS.find((x) => x.name === spot);
    if (sh) return sh.pos;
    const w = s.trip?.walked ?? [];
    return w[w.length - 1] ?? [135.5, 34.705];
  };

  const add = (dataUrl?: string) => {
    const p: TripPhoto = { id: uid(), dataUrl, hue: Math.floor(Math.random() * 360), spot, pos: pos(), visibility: vis, at: Date.now() };
    set((x) => (x.trip ? { ...x, trip: { ...x.trip, photos: [...x.trip.photos, p] } } : x));
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
  };

  const shoot = () => {
    const v = video.current;
    if (cam === "on" && v && v.videoWidth) add(shrink(v, v.videoWidth, v.videoHeight, facing === "user"));
    else add();
  };

  const fromLibrary = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f);
      const im = new Image();
      im.onload = () => {
        add(shrink(im, im.naturalWidth, im.naturalHeight));
        URL.revokeObjectURL(url);
      };
      im.src = url;
    });
  };

  return (
    <div className="screen" style={{ background: "#0B0B2A", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div className="row between" style={{ padding: "14px 16px" }}>
        <button className="icon-btn" aria-label="閉じる" style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "none" }} onClick={() => nav(-1)}><Icon name="close" /></button>
        <div className="row" style={{ gap: 6, background: "rgba(255,255,255,.12)", padding: "8px 14px", borderRadius: 18, fontWeight: 700, fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--accent)" }} />{spot}
        </div>
        <button className="icon-btn" aria-label={facing === "user" ? "外カメラに切り替え" : "内カメラに切り替え"} style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "none" }} onClick={() => setFacing(facing === "user" ? "environment" : "user")}><Icon name="flip" /></button>
      </div>

      <div style={{ flex: 1, position: "relative", margin: "0 12px", borderRadius: 28, overflow: "hidden", background: "#1A1A40" }}>
        <video ref={video} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: cam === "on" ? "block" : "none", transform: facing === "user" ? "scaleX(-1)" : undefined }} />
        {cam !== "on" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 30, textAlign: "center",
            background: "linear-gradient(160deg, color-mix(in srgb, var(--base) 70%, #000), #1A1A40)" }}>
            <Icon name="camera" size={40} style={{ color: "var(--accent)" }} />
            <b>{cam === "wait" ? "カメラを起動中…" : "カメラが使えないため、プレビュー撮影になります"}</b>
            <span style={{ fontSize: 12, opacity: .7 }}>右下からライブラリの写真も追加できます</span>
          </div>
        )}
        {/* grid guide */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(90deg, transparent 33.1%, rgba(255,255,255,.25) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255,255,255,.25) 66.7%, transparent 66.9%), linear-gradient(transparent 33.1%, rgba(255,255,255,.25) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255,255,255,.25) 66.7%, transparent 66.9%)" }} />
        {flash && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: .8 }} />}
        <div className="row" style={{ position: "absolute", left: 12, right: 12, bottom: 12, gap: 6, justifyContent: "center" }}>
          {VIS.map((v) => (
            <button key={v.k} onClick={() => setVis(v.k)} className="row"
              style={{ gap: 4, height: 36, padding: "0 12px", borderRadius: 18, border: "none", fontWeight: 700, fontSize: 12,
                background: vis === v.k ? "var(--accent)" : "rgba(0,0,0,.45)", color: vis === v.k ? "var(--base)" : "#fff" }}>
              <Icon name={v.icon} size={14} />{v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row between" style={{ padding: "20px 28px 28px" }}>
        <button onClick={() => nav(-1)} aria-label="撮った写真" style={{ border: "none", background: "none", padding: 0, position: "relative" }}>
          {shots.length ? (
            <Photo p={shots[shots.length - 1]} w={54} h={54} r={14} style={{ border: "2px solid #fff" }} />
          ) : (
            <span style={{ display: "block", width: 54, height: 54, borderRadius: 14, border: "2px solid rgba(255,255,255,.3)" }} />
          )}
          {shots.length > 0 && <span className="lv" style={{ position: "absolute", top: -8, right: -8, background: "var(--accent)", color: "var(--base)" }}>{shots.length}</span>}
        </button>
        <button aria-label="シャッター" onClick={shoot} style={{ width: 82, height: 82, borderRadius: 41, border: "5px solid #fff", background: "var(--accent)", boxShadow: "0 0 0 4px rgba(255,255,255,.15)" }} />
        <label aria-label="ライブラリから追加" style={{ width: 54, height: 54, borderRadius: 27, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="image" />
          <input type="file" accept="image/*" multiple hidden onChange={(e) => fromLibrary(e.target.files)} />
        </label>
      </div>
      <div style={{ textAlign: "center", paddingBottom: 18 }}>
        <button className="btn accent sm" onClick={() => nav(-1)}>完了して旅にもどる</button>
      </div>
    </div>
  );
}
