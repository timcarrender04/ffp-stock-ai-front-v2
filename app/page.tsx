import { Top25MoonshotTable } from "@/components/dashboard/Top25MoonshotTable";
import { NewsRadar } from "@/components/dashboard/NewsRadar";
import { fetchMoonshotTop } from "@/lib/services/moonshot";
import {
  fetchLatestNewsArticles,
  fetchLatestNewsEvents,
  fetchNewsQueue,
} from "@/lib/services/news";

export default async function Home() {
  const [top25, events, articles, queue] = await Promise.all([
    fetchMoonshotTop(25),
    fetchLatestNewsEvents(8),
    fetchLatestNewsArticles(6),
    fetchNewsQueue(6),
  ]);

  return (
    <section className="flex min-h-full flex-col gap-6 sm:gap-8 py-6 sm:py-10 w-full max-w-full overflow-x-hidden">
      <header className="rounded-3xl border border-finance-green-20 bg-gradient-to-br from-finance-surface-80/80 via-finance-surface-70 to-finance-surface-60 p-4 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-xl w-full max-w-full box-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-finance-green-70">
              Moonshot Lens
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">
              Top 25 conviction ladder, live AI agents, and catalyst feed.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300">
              Nothing extra—just the data we trust: the Moonshot Top 25,
              real-time AI commentary, and curated news & social intelligence.
            </p>
          </div>
        </div>
      </header>

      <Top25MoonshotTable top={top25} />

      <NewsRadar articles={articles} events={events} queue={queue} />
    </section>
  );
}
