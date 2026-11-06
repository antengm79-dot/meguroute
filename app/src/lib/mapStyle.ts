import type { StyleSpecification } from "maplibre-gl";

/** recolor OpenFreeMap "liberty" into the めぐる〜と light look */
export function restyle(st: StyleSpecification): StyleSpecification {
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
