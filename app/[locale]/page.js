import Hero from '@/components/home/Hero';
import LatestSets from '@/components/home/LatestSets';
import RecentlyViewed from '@/components/home/RecentlyViewed';
import TrendingSection from '@/components/home/TrendingSection';
import TopRisersSection from '@/components/home/TopRisersSection';
import { getJpyToHkdRate } from '@/lib/currency';
import { getLatestBoxes, getTrendingCards, getTopRisers } from '@/lib/db';

// Static page with 1 hour revalidation
export const revalidate = 3600; // 1 hour

export default async function Home() {
  const [latestBoxes, trendingCards, topRisers, rate] = await Promise.all([
    getLatestBoxes(8),
    getTrendingCards(4),
    getTopRisers(4),
    getJpyToHkdRate()
  ]);

  return (
    <div className="container">
      <Hero />
      <div style={{ marginTop: '40px', marginBottom: '80px' }}>

        {/* Featured Sections */}
        <TrendingSection cards={trendingCards} rate={rate} />
        <TopRisersSection cards={topRisers} rate={rate} />

        <LatestSets sets={latestBoxes} rate={rate} />

        <RecentlyViewed rate={rate} />
      </div>
    </div>
  );
}
