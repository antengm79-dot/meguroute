// 地図スタイルに restyle をかけたあと、MapLibre の仕様として正しいかを確かめる
// 使い方: node --experimental-strip-types scripts/check-style.ts <style.json>
import { readFileSync } from "node:fs";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { restyle } from "../src/lib/mapStyle.ts";

const file = process.argv[2];
const st = JSON.parse(readFileSync(file, "utf8").replaceAll("__TILEJSON_DOMAIN__", "tiles.openfreemap.org"));
const before = validateStyleMin(st);
const after = validateStyleMin(restyle(structuredClone(st)));
console.log(`before: ${before.length} errors, after restyle: ${after.length} errors`);
for (const e of after.slice(0, 15)) console.log(" -", e.message);
