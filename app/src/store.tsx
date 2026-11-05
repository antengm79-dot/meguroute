import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LngLat } from "./lib/geo";
import { THEMES } from "./data/themes";
import { PAST_TRIPS } from "./data/pastTrips";

export type Visibility = "public" | "friends" | "private";

export type Stop = {
  id: string;
  kind: "category" | "place";
  cat?: string;
  shopId?: string; // fixed spot (search or chosen)
  name?: string;
  pos?: LngLat;
  stay?: number; // minutes
};

export type Plan = {
  date: string;
  mode: "walk" | "train" | "bike" | "car";
  area: string;
  start: { name: string; pos: LngLat; time: string };
  end: { name: string; pos: LngLat; time: string };
  stops: Stop[];
};

export type TripSpot = { name: string; pos: LngLat; shopId?: string; time?: string; cat?: string };

export type TripPhoto = {
  id: string;
  dataUrl?: string;
  hue: number;
  spot: string;
  pos: LngLat;
  visibility: Visibility;
  at: number;
};

export type Trip = {
  id: string;
  title: string;
  planned: LngLat[]; // walking route (may be empty = free walk)
  train?: LngLat[]; // train part (shown dashed)
  spots: TripSpot[];
  walked: LngLat[];
  visited: string[];
  photos: TripPhoto[];
  startedAt: number;
  endedAt?: number;
  tracing?: string; // public route id
  progress?: number; // meters along the route (demo walk)
  xpGained?: number;
  published?: boolean;
};

export type State = {
  themeId: string;
  frameId: string;
  xp: number;
  name: string;
  locked: boolean;
  plan: Plan;
  answers: Record<string, string>;
  trip?: Trip;
  history: Trip[];
  saved: string[];
  liked: string[];
  following: string[];
  requested: string[];
  followers: string[];
  requests: string[];
  recommended: Record<string, string[]>; // shopId -> photo ids pinned by store
  demoWalk: boolean;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const defaultPlan = (): Plan => ({
  date: today(),
  mode: "walk",
  area: "大阪・梅田〜中之島",
  start: { name: "中百舌鳥駅", pos: [135.503, 34.5562], time: "10:00" },
  end: { name: "北浜駅", pos: [135.5068, 34.6915], time: "18:00" },
  stops: [
    { id: "s1", kind: "category", cat: "cafe" },
    { id: "s2", kind: "category", cat: "shopping" },
    { id: "s3", kind: "category", cat: "park" },
  ],
});

const initial: State = {
  themeId: "mint",
  frameId: "accent",
  xp: 1330,
  name: "あおい",
  locked: false,
  plan: defaultPlan(),
  answers: {},
  history: PAST_TRIPS,
  saved: [],
  liked: [],
  following: ["rin_film"],
  requested: [],
  followers: ["rin_film", "yuu_sweets"],
  requests: ["nana.trip", "mio_walk"],
  recommended: {},
  demoWalk: true,
};

const KEY = "meguroute:v3";

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return initial;
}

type Ctx = { s: State; set: (fn: (s: State) => State) => void; reset: () => void };
const C = createContext<Ctx>(null!);

export function StoreProvider({ children, persist = true, seed }: { children: ReactNode; persist?: boolean; seed?: (s: State) => State }) {
  const [s, setS] = useState<State>(() => {
    const base = persist ? load() : initial;
    return seed ? seed(base) : base;
  });

  useEffect(() => {
    if (!persist) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // photos too big: save without image data
      try {
        const strip = (t?: Trip) => t && { ...t, photos: t.photos.map((p) => ({ ...p, dataUrl: undefined })) };
        localStorage.setItem(KEY, JSON.stringify({ ...s, trip: strip(s.trip), history: s.history.map(strip) }));
      } catch {
        /* ignore */
      }
    }
  }, [s, persist]);

  useEffect(() => {
    const t = THEMES.find((x) => x.id === s.themeId) ?? THEMES[0];
    const r = document.documentElement.style;
    r.setProperty("--base", t.base);
    r.setProperty("--accent", t.accent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#ffffff");
  }, [s.themeId]);

  return (
    <C.Provider value={{ s, set: (fn) => setS((p) => fn(p)), reset: () => setS(initial) }}>
      {children}
    </C.Provider>
  );
}

export const useStore = () => useContext(C);
export const theme = (s: State) => THEMES.find((x) => x.id === s.themeId) ?? THEMES[0];
export const uid = () => Math.random().toString(36).slice(2, 9);
