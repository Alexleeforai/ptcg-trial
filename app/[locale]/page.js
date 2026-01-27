import Hero from '@/components/home/Hero';
import LatestSets from '@/components/home/LatestSets';
import RecentlyViewed from '@/components/home/RecentlyViewed';
import TrendingSection from '@/components/home/TrendingSection';
import TopRisersSection from '@/components/home/TopRisersSection';
import { getJpyToHkdRate } from '@/lib/currency';
import { getLatestBoxes, getTrendingCards, getTopRisers } from '@/lib/db';

// Static page with 1 hour revalidation
// Static page with short revalidation
export const revalidate = 60; // 1 minute

export default async function Home() {
  const [latestBoxes, trendingCards, topRisers] = await Promise.all([
    getLatestBoxes(8),
    getTrendingCards(4),
    getTopRisers(4)
  ]);

  return (
    <div className="container">
      <Hero />
      <div style={{ marginTop: '40px', marginBottom: '80px' }}>

        {/* Featured Sections */}
        <TrendingSection cards={trendingCards} />
        <TopRisersSection cards={topRisers} />

        <LatestSets sets={latestBoxes} />

        <RecentlyViewed />
      </div>
    </div>
  );
}
