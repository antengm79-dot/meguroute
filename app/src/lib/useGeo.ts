import { useEffect, useState } from "react";
import { bearing, dist, type LngLat } from "./geo";

const OSAKA: LngLat = [135.4959, 34.7025];

/** Real GPS + compass when near the demo area, otherwise a fixed demo position (梅田駅). */
export function useGeo(enabled = true) {
  const [pos, setPos] = useState<LngLat | null>(null);
  const [heading, setHeading] = useState(20);
  const [real, setReal] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let last: LngLat | null = null;
    let id: number | undefined;
    const fallback = setTimeout(() => setPos((p) => p ?? OSAKA), 1500);
    if ("geolocation" in navigator) {
      id = navigator.geolocation.watchPosition(
        (g) => {
          const p: LngLat = [g.coords.longitude, g.coords.latitude];
          if (dist(p, OSAKA) > 60000) {
            setPos((x) => x ?? OSAKA);
            return;
          }
          setReal(true);
          if (g.coords.heading != null && !isNaN(g.coords.heading)) setHeading(g.coords.heading);
          else if (last && dist(last, p) > 3) setHeading(bearing(last, p));
          last = p;
          setPos(p);
        },
        () => setPos((x) => x ?? OSAKA),
        { enableHighAccuracy: true, maximumAge: 2000 },
      );
    }
    const onOri = (e: DeviceOrientationEvent) => {
      const h = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
      if (h != null) setHeading(h);
    };
    window.addEventListener("deviceorientation", onOri);
    return () => {
      clearTimeout(fallback);
      if (id !== undefined) navigator.geolocation.clearWatch(id);
      window.removeEventListener("deviceorientation", onOri);
    };
  }, [enabled]);

  return { pos, heading, real };
}
