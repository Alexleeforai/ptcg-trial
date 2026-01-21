import Hero from '@/components/home/Hero';
import LatestSets from '@/components/home/LatestSets';
import RecentlyViewed from '@/components/home/RecentlyViewed';
import { getJpyToHkdRate } from '@/lib/currency';
import { getLatestBoxes } from '@/lib/db';

export const revalidate = 3600; // 1 hour

export default async function Home() {
  const latestBoxes = getLatestBoxes(8); // Fetch top 8 latest boxes/sets
  const rate = await getJpyToHkdRate();

  return (
    <div className="container">
      <Hero />
      <div style={{ marginTop: '40px', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Trending Cards</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
          Featured Cards (Coming Soon)
        </div>

        <LatestSets sets={latestBoxes} rate={rate} />

        <RecentlyViewed rate={rate} />
      </div>
    </div>
  );
}
