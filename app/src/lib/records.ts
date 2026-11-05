import { lineLength } from "./geo";
import type { Trip } from "../store";

export const tripLen = (t: Trip) => lineLength(t.walked.length > 1 ? t.walked : t.planned);

export function totals(history: Trip[]) {
  return {
    meters: history.reduce((a, t) => a + tripLen(t), 0),
    spots: history.reduce((a, t) => a + t.visited.length, 0),
    photos: history.reduce((a, t) => a + t.photos.length, 0),
    trips: history.length,
  };
}
