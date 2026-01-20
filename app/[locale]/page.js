import Hero from '@/components/home/Hero';
import LatestSets from '@/components/home/LatestSets';
import RecentlyViewed from '@/components/home/RecentlyViewed';
import { getLatestSets } from '@/lib/data';

export default async function Home() {
  const latestSets = await getLatestSets();

  return (
    <div className="container">
      <Hero />
      <div style={{ marginTop: '40px', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Trending Cards</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
          Featured Cards (Coming Soon)
        </div>

        <LatestSets sets={latestSets} />

        <RecentlyViewed />
      </div>
    </div>
  );
}
