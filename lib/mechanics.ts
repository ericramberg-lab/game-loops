export type Difficulty = "Easy" | "Medium" | "Hard";
export type Engine = "Unity" | "Unreal" | "Godot" | "Web";

export type Mechanic = {
  name: string;
  slug: string;
  blurb: string;
  engines: Engine[];
  diff: Difficulty;
  price: string;
  preview: string;
  badge?: "NEW" | "HOT";
};

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
    name: "Lockpicking",
    slug: "lockpicking.loop",
    blurb: "Tension-and-pick tumbler with a moving sweet spot.",
    engines: ["Unity", "Godot"],
    diff: "Medium",
    price: "$18",
    preview: "lockpick preview",
  },
  {
    name: "Safe Cracking",
    slug: "safecracking.loop",
    blurb: "Listen for the click, dial in each number.",
    engines: ["Unity", "Unreal"],
    diff: "Hard",
    price: "$24",
    preview: "safe dial preview",
    badge: "NEW",
  },
  {
    name: "Hacking Node",
    slug: "hacking.loop",
    blurb: "Route the signal through a live circuit puzzle.",
    engines: ["Godot", "Web"],
    diff: "Medium",
    price: "$16",
    preview: "circuit preview",
  },
  {
    name: "Fishing",
    slug: "fishing.loop",
    blurb: "Cast, hook and hold the reel meter to land it.",
    engines: ["Unity", "Godot"],
    diff: "Easy",
    price: "$14",
    preview: "reel meter preview",
  },
  {
    name: "Wire Splicing",
    slug: "wiresplice.loop",
    blurb: "Match and connect the live wires before the spark.",
    engines: ["Unreal", "Unity"],
    diff: "Easy",
    price: "$12",
    preview: "wires preview",
  },
  {
    name: "Pickpocket",
    slug: "pickpocket.loop",
    blurb: "Steady-hand grab QTE with a shrinking window.",
    engines: ["Unity", "Web"],
    diff: "Hard",
    price: "$20",
    preview: "grab QTE preview",
    badge: "HOT",
  },
];

export const chips: string[] = ["Unity", "Unreal", "Godot", "Web", "Easy", "Medium", "Hard"];
