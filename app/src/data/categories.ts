export type Category = { key: string; label: string; icon: string };

// icon = key into ICONS (components/Icon.tsx)
export const CATEGORIES: Category[] = [
  { key: "cafe", label: "カフェ", icon: "cafe" },
  { key: "sweets", label: "スイーツ", icon: "sweets" },
  { key: "gourmet", label: "グルメ", icon: "gourmet" },
  { key: "shopping", label: "買い物", icon: "shopping" },
  { key: "park", label: "公園", icon: "park" },
  { key: "sea", label: "海", icon: "sea" },
  { key: "river", label: "川", icon: "river" },
  { key: "night", label: "夜景", icon: "night" },
  { key: "photo", label: "映え", icon: "sparkle" },
  { key: "shrine", label: "神社・寺", icon: "shrine" },
  { key: "museum", label: "美術館", icon: "museum" },
  { key: "play", label: "遊び", icon: "play" },
  { key: "movie", label: "映画", icon: "movie" },
  { key: "relax", label: "癒やし", icon: "relax" },
  { key: "event", label: "イベント", icon: "event" },
  { key: "conveni", label: "コンビニ", icon: "conveni" },
  { key: "toilet", label: "トイレ", icon: "toilet" },
];

export const catOf = (key: string) => CATEGORIES.find((c) => c.key === key)!;
