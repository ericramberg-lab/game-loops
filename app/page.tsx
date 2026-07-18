import Link from "next/link";
import { pocs } from "@/lib/pocs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10 sm:py-24">
        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Game Loops
          </h1>
          <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            A playground for gameplay proof of concepts. Each card below is a
            standalone experiment.
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {pocs.length} {pocs.length === 1 ? "prototype" : "prototypes"}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pocs.map((poc) => (
              <li key={poc.slug}>
                <Link
                  href={`/pocs/${poc.slug}`}
                  className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                >
                  <h3 className="text-lg font-medium text-zinc-900 group-hover:text-black dark:text-zinc-100">
                    {poc.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {poc.description}
                  </p>
                  {poc.tags && poc.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {poc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
