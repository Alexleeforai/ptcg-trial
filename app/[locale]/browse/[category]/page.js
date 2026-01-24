import { findCards } from '@/lib/db';
import { getJpyToHkdRate } from '@/lib/currency';
import LatestSets from '@/components/home/LatestSets'; // Reusing card grid logic
import { Link } from '@/lib/navigation';

export const revalidate = 3600;

export default async function BrowseCategoryPage({ params }) {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);

    // Fetch Cards
    // For trainers/items, we might need specific logic later, but for now findCards regex works well enough
    // if users search "trainers" it might fail, so we map category names back to query if needed

    let query = decodedCategory;
    if (category === 'trainers') query = 'Trainer'; // Simple heuristic
    if (category === 'items') query = 'Item';       // Simple heuristic

    // Actually, for Pokemon names "Charizard", findCards("Charizard") works great.
    // For Trainers, findCards("Trainer") might match too many things or nothing if DB doesn't have "Trainer" text in fields
    // But since we built Pokedex logic for writing, reading might rely on string match.
    // Let's rely on findCards basic search for now.

    const cards = await findCards(decodedCategory);
    const rate = await getJpyToHkdRate();

    // Filter out boxes if browsing specific pokemon
    const singles = cards.filter(c => c.cardType === 'single');

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <div style={{ marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/browse" style={{ color: '#666', textDecoration: 'none' }}>← Browse</Link>
                <span style={{ color: '#444' }}>/</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {decodedCategory}
                </h1>
                <span style={{ background: '#333', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: '#ccc' }}>
                    {singles.length}
                </span>
            </div>

            {singles.length > 0 ? (
                <LatestSets sets={singles} rate={rate} />
            ) : (
                <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
                    No cards found for this category.
                </div>
            )}
        </div>
    );
}
