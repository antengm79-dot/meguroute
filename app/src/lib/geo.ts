export type LngLat = [number, number]; // [lng, lat]

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function dist(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function bearing(a: LngLat, b: LngLat): number {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x =
    Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
    Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export function lineLength(line: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < line.length; i++) d += dist(line[i - 1], line[i]);
  return d;
}

/** point at distance `d` meters along the line, plus index of segment start */
export function along(line: LngLat[], d: number): { p: LngLat; i: number; heading: number } {
  if (line.length === 0) return { p: [0, 0], i: 0, heading: 0 };
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const seg = dist(line[i - 1], line[i]);
    if (acc + seg >= d) {
      const t = seg === 0 ? 0 : (d - acc) / seg;
      const p: LngLat = [
        line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t,
        line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t,
      ];
      return { p, i: i - 1, heading: bearing(line[i - 1], line[i]) };
    }
    acc += seg;
  }
  const n = line.length;
  return {
    p: line[n - 1],
    i: n - 2,
    heading: n > 1 ? bearing(line[n - 2], line[n - 1]) : 0,
  };
}

/** slice of line from start to distance d */
export function sliceTo(line: LngLat[], d: number): LngLat[] {
  const out: LngLat[] = [];
  if (!line.length) return out;
  out.push(line[0]);
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const seg = dist(line[i - 1], line[i]);
    if (acc + seg >= d) {
      out.push(along(line, d).p);
      return out;
    }
    out.push(line[i]);
    acc += seg;
  }
  return out;
}

/** distance along the line of the closest point to p */
export function project(line: LngLat[], p: LngLat): { d: number; off: number } {
  let best = { d: 0, off: Infinity };
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const seg = dist(a, b);
    // local equirectangular projection
    const kx = Math.cos(rad(a[1])) * 111320;
    const ky = 110540;
    const ax = 0, ay = 0;
    const bx = (b[0] - a[0]) * kx, by = (b[1] - a[1]) * ky;
    const px = (p[0] - a[0]) * kx, py = (p[1] - a[1]) * ky;
    const L2 = bx * bx + by * by;
    let t = L2 ? ((px - ax) * bx + (py - ay) * by) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const dx = px - bx * t, dy = py - by * t;
    const off = Math.sqrt(dx * dx + dy * dy);
    if (off < best.off) best = { d: acc + seg * t, off };
    acc += seg;
  }
  return best;
}

export function fmtDist(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function turnText(delta: number): string {
  const d = ((delta + 540) % 360) - 180;
  if (Math.abs(d) < 30) return "まっすぐ";
  if (d >= 30 && d < 135) return "右に曲がる";
  if (d <= -30 && d > -135) return "左に曲がる";
  return "Uターン";
}

export function bounds(line: LngLat[]): [LngLat, LngLat] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of line) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return [[minX, minY], [maxX, maxY]];
}
