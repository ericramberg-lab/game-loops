export type Difficulty = "Easy" | "Medium" | "Hard";
export type Engine = "Unity" | "Unreal" | "Godot" | "Web";
export type Platform = "Mobile" | "Desktop" | "Gamepad";

export type Tag =
  | "lockpick"
  | "safecrack"
  | "hack"
  | "fish"
  | "reload"
  | "pickpocket"
  | "wire"
  | "diffuse"
  | "climb"
  | "stealth"
  | "timing"
  | "reflex"
  | "puzzle"
  | "memory"
  | "focus"
  | "multitask"
  | "precision"
  | "patience";

export type Mechanic = {
  name: string;
  slug: string;
  blurb: string;
  engines: Engine[];
  platforms: Platform[];
  diff: Difficulty;
  price: string;
  preview: string;
  tags: Tag[];
  badge?: "NEW" | "HOT" | "LIVE";
  href?: string;
};

export const ALL_TAGS: Tag[] = [
  "lockpick",
  "safecrack",
  "hack",
  "fish",
  "reload",
  "pickpocket",
  "wire",
  "diffuse",
  "climb",
  "stealth",
  "timing",
  "reflex",
  "puzzle",
  "memory",
  "focus",
  "multitask",
  "precision",
  "patience",
];

export const difficultyStyle: Record<
  Difficulty,
  { color: string; bg: string }
> = {
  Easy:   { color: "#46f0a0", bg: "rgba(70,240,160,.14)" },
  Medium: { color: "#ffcf5c", bg: "rgba(255,207,92,.14)" },
  Hard:   { color: "#ff5e7a", bg: "rgba(255,94,122,.14)" },
};

export const mechanics: Mechanic[] = [
  {
    name: "Split Focus",
    slug: "split-focus.loop",
    blurb:
      "Three tasks at once — keep the crosshair centered, react to matching blocks, and solve the math as it drains.",
    engines: ["Web"],
    platforms: ["Desktop"],
    diff: "Hard",
    price: "FREE",
    preview: "focus meter preview",
    tags: ["focus", "multitask", "reflex", "timing"],
    badge: "LIVE",
    href: "/loops/split-focus",
  },
  {
    name: "Execute",
    slug: "execute.loop",
    blurb:
      "Simon-says with a bomb-defuse twist. Only orders prefixed with EXECUTE count — everything else is a decoy.",
    engines: ["Web"],
    platforms: ["Desktop", "Mobile"],
    diff: "Medium",
    price: "FREE",
    preview: "wire cut preview",
    tags: ["diffuse", "wire", "focus", "reflex"],
    badge: "LIVE",
    href: "/loops/execute",
  },
  {
    name: "Lockpicking",
    slug: "lockpicking.loop",
    blurb: "Tension-and-pick tumbler with a moving sweet spot.",
    engines: ["Unity", "Godot"],
    platforms: ["Desktop", "Gamepad", "Mobile"],
    diff: "Medium",
    price: "$18",
    preview: "lockpick preview",
    tags: ["lockpick", "timing", "precision"],
  },
  {
    name: "Safe Cracking",
    slug: "safecracking.loop",
    blurb: "Listen for the click, dial in each number.",
    engines: ["Unity", "Unreal"],
    platforms: ["Desktop", "Gamepad"],
    diff: "Hard",
    price: "$24",
    preview: "safe dial preview",
    tags: ["safecrack", "memory", "timing"],
    badge: "NEW",
  },
  {
    name: "Hacking Node",
    slug: "hacking.loop",
    blurb: "Route the signal through a live circuit puzzle.",
    engines: ["Godot", "Web"],
    platforms: ["Desktop", "Mobile"],
    diff: "Medium",
    price: "$16",
    preview: "circuit preview",
    tags: ["hack", "puzzle", "focus"],
  },
  {
    name: "Fishing",
    slug: "fishing.loop",
    blurb: "Cast, hook and hold the reel meter to land it.",
    engines: ["Unity", "Godot"],
    platforms: ["Mobile", "Desktop", "Gamepad"],
    diff: "Easy",
    price: "$14",
    preview: "reel meter preview",
    tags: ["fish", "timing", "patience"],
  },
  {
    name: "Wire Splicing",
    slug: "wiresplice.loop",
    blurb: "Match and connect the live wires before the spark.",
    engines: ["Unreal", "Unity"],
    platforms: ["Mobile", "Desktop"],
    diff: "Easy",
    price: "$12",
    preview: "wires preview",
    tags: ["wire", "diffuse", "puzzle"],
  },
  {
    name: "Pickpocket",
    slug: "pickpocket.loop",
    blurb: "Steady-hand grab QTE with a shrinking window.",
    engines: ["Unity", "Web"],
    platforms: ["Mobile", "Gamepad"],
    diff: "Hard",
    price: "$20",
    preview: "grab QTE preview",
    tags: ["pickpocket", "reflex", "stealth"],
    badge: "HOT",
  },
];

export const chips: string[] = [
  "Mobile",
  "Desktop",
  "Gamepad",
  "Unity",
  "Unreal",
  "Godot",
  "Web",
  "Easy",
  "Medium",
  "Hard",
];
