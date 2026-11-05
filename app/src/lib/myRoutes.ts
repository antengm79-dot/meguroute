import type { PublicRoute, User } from "../data/routes";
import { levelOf } from "../data/themes";
import { lineLength } from "./geo";
import type { State } from "../store";

export const meUser = (s: State): User => ({ id: "me", name: s.name, level: levelOf(s.xp), frame: s.frameId, locked: s.locked, hue: 230 });

/** my published trips, shaped like feed routes */
export function myRoutes(s: State): PublicRoute[] {
  return s.history
    .filter((t) => t.published)
    .map((t) => {
      const path = t.walked.length > 1 ? t.walked : t.planned;
      const names = [...new Set(t.photos.map((p) => p.spot))];
      const spots = (names.length ? names : t.visited).map((n) => {
        const ps = t.photos.filter((p) => p.spot === n);
        return { name: n, pos: ps[0]?.pos ?? t.spots.find((x) => x.name === n)?.pos ?? path[0], photos: ps.map((p) => ({ id: p.id, hue: p.hue, src: p.dataUrl })) };
      });
      const d = new Date(t.startedAt || Date.now());
      return {
        id: "my-" + t.id, userId: "me", title: t.title, area: "大阪", date: `${d.getMonth() + 1}/${d.getDate()}`,
        path, spots, distance: lineLength(path), likes: 0, saves: 0,
      };
    });
}
