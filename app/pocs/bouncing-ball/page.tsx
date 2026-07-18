import BouncingBall from "./BouncingBall";

export const metadata = {
  title: "Bouncing Ball · Game Loops",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Bouncing Ball
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        A minimal canvas loop. Use it as a starting template for other
        canvas-based prototypes.
      </p>
      <BouncingBall />
    </div>
  );
}
