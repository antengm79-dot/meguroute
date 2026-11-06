import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import type { Photo as PhotoT } from "../data/spots";
import { levelColor } from "../data/themes";
import type { User } from "../data/routes";

/** smiling pin character from the めぐる〜と logo */
export function PinChara({ size = 96, mood = "smile" }: { size?: number; mood?: "smile" | "wink" }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" aria-hidden="true" className="chara">
      <path d="M50 116 C 40 100, 8 76, 8 46 A 42 42 0 0 1 92 46 C 92 76, 60 100, 50 116 Z" fill="var(--accent)" />
      <circle cx="50" cy="46" r="27" fill="#fff" />
      {mood === "wink" ? (
        <path d="M36 42 q4 -4 8 0" stroke="var(--base)" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <rect x="37" y="36" width="5" height="11" rx="2.5" fill="var(--base)" />
      )}
      <rect x="58" y="36" width="5" height="11" rx="2.5" fill="var(--base)" />
      <path d="M40 54 q10 9 20 0" stroke="var(--base)" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ icon = false, white = false, height = 34 }: { icon?: boolean; white?: boolean; height?: number }) {
  const src = icon ? "logo-icon.png" : white ? "logo-white.png" : "logo.png";
  return <img src={src} alt="めぐる〜と" style={{ height, display: "block" }} />;
}

export function Top({ title, back, right, left }: { title?: ReactNode; back?: boolean | string; right?: ReactNode; left?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="top">
      {back ? (
        <button className="icon-btn" aria-label="戻る" onClick={() => (typeof back === "string" ? nav(back) : nav(-1))}>
          <Icon name="back" />
        </button>
      ) : (
        left ?? <Logo height={30} />
      )}
      <div className="grow" style={{ textAlign: back ? "center" : "left", overflow: "hidden" }}>
        {typeof title === "string" ? <h1 className="h-ja" style={{ fontSize: 18 }}>{title}</h1> : title}
      </div>
      {right ?? (back ? <span style={{ width: 44 }} /> : null)}
    </div>
  );
}

export function Photo({ p, w, h, r = 14, style, children, by }: { p: PhotoT | { hue: number; src?: string; dataUrl?: string }; w?: number | string; h?: number | string; r?: number; style?: CSSProperties; children?: ReactNode; by?: string }) {
  const src = (p as { dataUrl?: string }).dataUrl || p.src;
  const [ok, setOk] = useState<boolean>(!!(p as { dataUrl?: string }).dataUrl);
  useEffect(() => {
    if (!src || (p as { dataUrl?: string }).dataUrl) return;
    const im = new Image();
    im.onload = () => setOk(true);
    im.onerror = () => setOk(false);
    im.src = src;
  }, [src, p]);
  const bg = ok && src
    ? { backgroundImage: `url(${src})` }
    : { background: `linear-gradient(135deg, hsl(${p.hue} 72% 78%), hsl(${(p.hue + 45) % 360} 70% 62%))` };
  return (
    <div className="photo" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...bg, ...style }}>
      {!ok && (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.35 }} aria-hidden="true">
          <circle cx="72" cy="28" r="10" fill="#fff" />
          <path d="M0 80 L30 50 L52 70 L70 55 L100 82 V100 H0Z" fill="#fff" />
        </svg>
      )}
      {by && <span className="by">@{by}</span>}
      {children}
    </div>
  );
}

export function Avatar({ u, size = 40 }: { u: Pick<User, "name" | "hue" | "level">; size?: number }) {
  return (
    <span className="ring" style={{ background: levelColor(u.level) }}>
      <span className="avatar" style={{ width: size, height: size, background: `hsl(${u.hue} 60% 55%)`, fontSize: size * 0.4 }}>{u.name.slice(0, 1)}</span>
    </span>
  );
}

export function LvBadge({ lv }: { lv: number }) {
  return <span className="lv" style={{ background: levelColor(lv) }}>LV.{lv}</span>;
}

/**
 * スクロールしない画面の枠（.stage）に重ねて描く。
 * スクロールする画面の中に absolute で置くと、スクロールに合わせてずれてしまうため。
 */
export function StageLayer({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setHost((anchor.current?.closest(".stage") as HTMLElement | null) ?? document.body);
  }, []);
  return (
    <>
      <span ref={anchor} hidden />
      {host && createPortal(children, host)}
    </>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <StageLayer>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog">
        <div className="grab" />
        {children}
      </div>
    </StageLayer>
  );
}

export function TabBar() {
  const t = [
    { to: "/", icon: "home", label: "ホーム" },
    { to: "/feed", icon: "users", label: "みんな" },
    { to: "/plan", icon: "sparkle", label: "ルート" },
    { to: "/me", icon: "user", label: "マイページ" },
  ];
  return (
    <nav className="tabbar">
      {t.map((x) => (
        <NavLink key={x.to} to={x.to} end={x.to === "/"}>
          <Icon name={x.icon} size={22} />
          {x.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function useToast(): [ReactNode, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 1800);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg ? <StageLayer><div className="toast">{msg}</div></StageLayer> : null, setMsg];
}
