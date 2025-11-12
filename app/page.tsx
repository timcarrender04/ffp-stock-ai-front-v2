import { MoonshotOverview } from "@/components/dashboard/MoonshotOverview";
import { DailyScalpPanel } from "@/components/dashboard/DailyScalpPanel";
import { MarketConditionsCard } from "@/components/dashboard/MarketConditionsCard";
import { NewsRadar } from "@/components/dashboard/NewsRadar";
import { TierDashboard } from "@/components/dashboard/TierDashboard";
import {
  fetchMoonshotTop,
  fetchMoonshotConsensus,
  fetchMoonshotRecommendations,
} from "@/lib/services/moonshot";
import {
  fetchActiveDailyScalpPositions,
  fetchDailyScalpPerformance,
  fetchUpcomingDailyScalpOrders,
} from "@/lib/services/dailyScalp";
import {
  fetchLatestMarketCondition,
  fetchMarketBreadth,
  fetchMarketSentiment,
} from "@/lib/services/market";
import {
  fetchLatestNewsArticles,
  fetchLatestNewsEvents,
  fetchNewsQueue,
} from "@/lib/services/news";

export default async function Home() {
  const [
    topSignals,
    consensus,
    recommendations,
    performance,
    positions,
    orders,
    marketCondition,
    breadth,
    sentiment,
    events,
    articles,
    queue,
  ] = await Promise.all([
    fetchMoonshotTop(6),
    fetchMoonshotConsensus(4),
    fetchMoonshotRecommendations(4),
    fetchDailyScalpPerformance(7),
    fetchActiveDailyScalpPositions(4),
    fetchUpcomingDailyScalpOrders(4),
    fetchLatestMarketCondition(),
    fetchMarketBreadth(8),
    fetchMarketSentiment(8),
    fetchLatestNewsEvents(8),
    fetchLatestNewsArticles(6),
    fetchNewsQueue(6),
  ]);

  return (
    <section className="flex min-h-full flex-col gap-8 py-10">
      <header className="rounded-3xl border border-finance-green-20 bg-gradient-to-br from-finance-surface-80/80 via-finance-surface-70 to-finance-surface-60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-finance-green-70">
              Moonshot Command Center
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Institutional-grade signals, social intelligence, and news radar
              in one screen.
            </h1>
            <p className="text-sm text-zinc-300">
              Monitor AI-driven ranks, scalping execution, macro sentiment, and
              catalyst-driven events with a single, encrypted Supabase session.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-finance-green-30 bg-black/20 p-4 text-sm text-zinc-300">
            <p className="text-xs uppercase tracking-[0.3em] text-finance-green-60">
              Session Stats
            </p>
            <p>
              Signals Online:{" "}
              <span className="font-semibold text-white">
                {topSignals.length}
              </span>
            </p>
            <p>
              Queue Items:{" "}
              <span className="font-semibold text-white">{queue.length}</span>
            </p>
            <p>
              Open Positions:{" "}
              <span className="font-semibold text-white">
                {positions.length}
              </span>
            </p>
          </div>
        </div>
      </header>

      <MoonshotOverview
        consensus={consensus}
        recommendations={recommendations}
        top={topSignals}
      />

      <DailyScalpPanel
        orders={orders}
        performance={performance}
        positions={positions}
      />

      <MarketConditionsCard
        breadth={breadth}
        condition={marketCondition}
        sentiment={sentiment}
      />

      <NewsRadar articles={articles} events={events} queue={queue} />

      <div className="rounded-3xl border border-finance-green-20 bg-finance-surface-70/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
              Deep Dive
            </p>
            <h2 className="text-xl font-semibold text-white">
              Moonshot Tier Monitor
            </h2>
            <p className="text-sm text-zinc-300">
              Toggle Top 25/50/100 cohorts, refresh live, and drill into AI,
              news, and social confluence on-demand.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <TierDashboard />
        </div>
      </div>
    </section>
  );
}
