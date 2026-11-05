import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as maplibregl from "maplibre-gl";
type StyleSpecification = maplibregl.StyleSpecification;
type MLMap = maplibregl.Map;
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

maplibregl.setWorkerUrl(workerUrl);
import type { LngLat } from "../lib/geo";
import { bounds } from "../lib/geo";
import type { Shop } from "../data/spots";
import { catOf } from "../data/categories";
import type { TripSpot } from "../store";

// OpenStreetMap Japan（日本語ラベル）→ OpenFreeMap の順に試す
const STYLE_URLS = [
  "https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json",
  "https://tiles.openfreemap.org/styles/liberty",
];

let styleCache: Promise<StyleSpecification | null> | null = null;

async function tryStyle(url: string): Promise<StyleSpecification | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    return r.ok ? ((await r.json()) as StyleSpecification) : null;
  } catch {
    return null;
  }
}

function fetchStyle(): Promise<StyleSpecification | null> {
  if (!styleCache) {
    styleCache = (async () => {
      for (const u of STYLE_URLS) {
        const st = await tryStyle(u);
        if (st) return restyle(st);
      }
      return null;
    })();
  }
  return styleCache;
}

/** recolor OpenFreeMap "liberty" into the めぐる〜と light look */
function restyle(st: StyleSpecification): StyleSpecification {
  const name = ["coalesce", ["get", "name:ja"], ["get", "name"]];
  for (const l of st.layers as any[]) {
    const id: string = l.id;
    l.paint = l.paint || {};
    if (l.type === "background") l.paint["background-color"] = "#FBFBFE";
    if (l.type === "fill") {
      if (/water/.test(id)) l.paint["fill-color"] = "#D9E3FF";
      else if (/park|grass|wood|landcover|forest|garden|pitch|cemetery/.test(id)) l.paint["fill-color"] = "#E4F6E2";
      else if (/building/.test(id)) {
        l.paint["fill-color"] = "#EEF0F8";
        l.paint["fill-outline-color"] = "#E0E3F0";
      } else if (/landuse|residential/.test(id)) l.paint["fill-color"] = "#F6F7FB";
    }
    if (l.type === "fill-extrusion") {
      l.paint["fill-extrusion-color"] = "#EEF0F8";
      l.paint["fill-extrusion-opacity"] = 0.6;
    }
    if (l.type === "line") {
      if (/water|river|canal/.test(id)) l.paint["line-color"] = "#C9D6FF";
      else if (/casing/.test(id)) l.paint["line-color"] = "#D5D9EA";
      else if (/road|highway|bridge|tunnel|street|path|minor|major|motorway|trunk|primary|secondary|tertiary|service|track/.test(id))
        l.paint["line-color"] = "#FFFFFF";
      else if (/rail/.test(id)) l.paint["line-color"] = "#C3C8DD";
      else if (/boundary/.test(id)) l.paint["line-opacity"] = 0.3;
    }
    if (l.type === "symbol") {
      if (l.layout && "text-field" in l.layout && /poi|place|label|name|water|airport|station/.test(id)) l.layout["text-field"] = name;
      l.paint["text-color"] = /poi/.test(id) ? "#2A2F55" : "#4A5070";
      l.paint["text-halo-color"] = "#FFFFFF";
      l.paint["text-halo-width"] = 1.6;
    }
  }
  return st;
}

const FALLBACK: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "rgba(0,0,0,0)" } }],
};

export type PhotoPin = { pos: LngLat; label: string; img?: string; hue: number };

type Props = {
  center?: LngLat;
  zoom?: number;
  base: string;
  accent: string;
  shops?: Shop[];
  onShop?: (s: Shop) => void;
  onPoi?: (name: string, pos: LngLat) => void;
  planned?: LngLat[];
  train?: LngLat[];
  walked?: LngLat[];
  ghost?: LngLat[]; // traced route (someone else's)
  spots?: TripSpot[];
  visited?: string[];
  me?: { pos: LngLat; heading: number } | null;
  follow?: boolean;
  fit?: LngLat[];
  fitKey?: string;
  photoPins?: PhotoPin[];
  padding?: { top: number; bottom: number; left: number; right: number };
  onMap?: (m: MLMap) => void;
};

export default function MapView(p: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const markers = useRef<Record<string, maplibregl.Marker[]>>({});
  const meMarker = useRef<maplibregl.Marker | null>(null);
  const cb = useRef(p);
  cb.current = p;
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const [, setTick] = useState(0);

  // create
  useEffect(() => {
    let dead = false;
    fetchStyle().then((st) => {
      if (dead || !el.current) return;
      if (!st) setOffline(true);
      const m = new maplibregl.Map({
        container: el.current,
        style: st ?? FALLBACK,
        center: p.center ?? [135.502, 34.704],
        zoom: p.zoom ?? 15.5,
        attributionControl: { compact: true },
        pitchWithRotate: false,
      });
      map.current = m;
      m.on("load", () => {
        // route overlay (SVG) lives inside the canvas container, under the markers
        const ov = document.createElement("div");
        ov.className = "route-ov";
        m.getCanvasContainer().appendChild(ov);
        setOverlay(ov);
        let raf = 0;
        m.on("move", () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => setTick((x) => x + 1));
        });
        m.on("resize", () => setTick((x) => x + 1));

        // tappable store POIs from the base map
        const poiLayers = (m.getStyle().layers || []).filter((l: { id: string }) => /^poi/.test(l.id)).map((l: { id: string }) => l.id);
        for (const id of poiLayers) {
          m.on("click", id, (e: maplibregl.MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            const nm = (f.properties?.["name:ja"] || f.properties?.name) as string;
            if (nm) cb.current.onPoi?.(nm, [e.lngLat.lng, e.lngLat.lat]);
          });
          m.on("mouseenter", id, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", id, () => (m.getCanvas().style.cursor = ""));
        }
        setReady(true);
        cb.current.onMap?.(m);
      });
    });
    return () => {
      dead = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // marker groups
  const setGroup = (key: string, list: maplibregl.Marker[]) => {
    markers.current[key]?.forEach((mk) => mk.remove());
    markers.current[key] = list;
    list.forEach((mk) => mk.addTo(map.current!));
  };

  useEffect(() => {
    if (!ready) return;
    setGroup(
      "shops",
      (p.shops ?? []).map((s) => {
        const d = document.createElement("button");
        d.className = s.featured ? "pin pin-big" : "pin";
        d.setAttribute("aria-label", s.name);
        d.innerHTML = s.featured
          ? `<span class="pin-head"><span class="pin-cat">${catOf(s.cat).label}</span></span><span class="pin-name">${s.name}</span>`
          : `<span class="pin-dot"></span><span class="pin-name">${s.name}</span>`;
        d.onclick = (e) => {
          e.stopPropagation();
          cb.current.onShop?.(s);
        };
        return new maplibregl.Marker({ element: d, anchor: s.featured ? "bottom" : "left", offset: s.featured ? [0, 0] : [-6, 0] }).setLngLat(s.pos);
      }),
    );
  }, [ready, p.shops]);

  useEffect(() => {
    if (!ready) return;
    setGroup(
      "spots",
      (p.spots ?? []).map((s, i) => {
        const d = document.createElement("div");
        const done = p.visited?.includes(s.name);
        d.className = "spot-pin" + (done ? " done" : "");
        d.innerHTML = `<b>${i + 1}</b><span>${s.name}</span>`;
        return new maplibregl.Marker({ element: d, anchor: "bottom" }).setLngLat(s.pos);
      }),
    );
  }, [ready, p.spots, p.visited]);

  useEffect(() => {
    if (!ready) return;
    setGroup(
      "photos",
      (p.photoPins ?? []).map((ph) => {
        const d = document.createElement("div");
        d.className = "photo-pin";
        d.innerHTML = `<div class="ph" style="${ph.img ? `background-image:url(${ph.img})` : `background:linear-gradient(135deg,hsl(${ph.hue} 70% 72%),hsl(${(ph.hue + 40) % 360} 75% 60%))`}"></div><span>${ph.label}</span>`;
        return new maplibregl.Marker({ element: d, anchor: "bottom" }).setLngLat(ph.pos);
      }),
    );
  }, [ready, p.photoPins]);

  // me arrow
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    if (!p.me) {
      meMarker.current?.remove();
      meMarker.current = null;
      return;
    }
    if (!meMarker.current) {
      const d = document.createElement("div");
      d.className = "me-arrow";
      d.innerHTML = `<div class="me-pulse"></div><svg viewBox="0 0 40 40" width="40" height="40"><path d="M20 4 L32 34 L20 27 L8 34 Z" fill="var(--base)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;
      meMarker.current = new maplibregl.Marker({ element: d, rotationAlignment: "map" }).setLngLat(p.me.pos).addTo(m);
    }
    meMarker.current.setLngLat(p.me.pos);
    meMarker.current.setRotation(p.me.heading);
    if (p.follow) m.jumpTo({ center: p.me.pos });
  }, [ready, p.me, p.follow]);

  // fit
  useEffect(() => {
    const m = map.current;
    if (!ready || !m || !p.fit || p.fit.length < 2) return;
    const b = bounds(p.fit);
    m.fitBounds(b, { padding: p.padding ?? { top: 120, bottom: 300, left: 50, right: 50 }, duration: 600, maxZoom: 16.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, p.fitKey]);

  const m = map.current;
  const path = (line?: LngLat[]) => {
    if (!m || !line || line.length < 2) return "";
    return "M" + line.map((c) => { const q = m.project(c as [number, number]); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join("L");
  };
  const z = m ? m.getZoom() : 15;
  const w = Math.max(0.55, Math.min(1.5, (z - 11) / 4.5)); // stroke scale by zoom
  const dPlan = path(p.planned), dWalk = path(p.walked), dTrain = path(p.train), dGhost = path(p.ghost);

  return (
    <div ref={el} className={"map" + (offline ? " map-offline" : "")}>
      {overlay && m &&
        createPortal(
          <svg className="route-svg" width="100%" height="100%" aria-hidden="true">
            <defs>
              <filter id="haze-big" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={11 * w} /></filter>
              <filter id="haze-mid" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={4.5 * w} /></filter>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6 * w} /></filter>
            </defs>
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {dGhost && <path d={dGhost} stroke="#8A8FB0" strokeOpacity=".6" strokeWidth={5 * w} strokeDasharray={`${2 * w} ${9 * w}`} />}
              {dTrain && <path d={dTrain} stroke={p.base} strokeOpacity=".55" strokeWidth={3.5 * w} strokeDasharray={`${6 * w} ${7 * w}`} />}
              {dPlan && (
                <>
                  {/* 紺色のモヤモヤ */}
                  <path d={dPlan} stroke={p.base} strokeOpacity=".28" strokeWidth={34 * w} filter="url(#haze-big)" />
                  <path d={dPlan} stroke={p.base} strokeOpacity=".42" strokeWidth={14 * w} filter="url(#haze-mid)" />
                  <path d={dPlan} stroke={p.base} strokeOpacity=".35" strokeWidth={3 * w} strokeDasharray={`${1 * w} ${8 * w}`} />
                </>
              )}
              {dWalk && (
                <>
                  {/* 歩いた道 */}
                  <path d={dWalk} stroke={p.accent} strokeOpacity=".95" strokeWidth={24 * w} filter="url(#glow)" />
                  <path d={dWalk} stroke={p.base} strokeOpacity=".35" strokeWidth={9 * w} />
                  <path d={dWalk} stroke={p.accent} strokeWidth={6.5 * w} />
                </>
              )}
            </g>
          </svg>,
          overlay,
        )}
    </div>
  );
}
