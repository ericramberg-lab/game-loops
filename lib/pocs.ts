export type Poc = {
  slug: string;
  title: string;
  description: string;
  tags?: string[];
};

export const pocs: Poc[] = [
  {
    slug: "bouncing-ball",
    title: "Bouncing Ball",
    description:
      "A tiny canvas demo — a ball bouncing off the walls. Useful as a starting template for canvas-based POCs.",
    tags: ["canvas", "example"],
  },
];
