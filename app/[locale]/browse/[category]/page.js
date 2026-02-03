import { findCards } from '@/lib/db';
import { getJpyToHkdRate } from '@/lib/currency';
import LatestSets from '@/components/home/LatestSets'; // Reusing card grid logic
import { Link } from '@/lib/navigation';
import SortFilter from '@/components/search/SortFilter';

export const revalidate = 3600;

export default async function BrowseCategoryPage({ params, searchParams }) {
    const { category } = await params;
    const resolvedParams = await searchParams;
    const sort = resolvedParams?.sort || 'number-asc'; // Default to number for sets
    const decodedCategory = decodeURIComponent(category);

    // Fetch Cards
    let query = decodedCategory;
    if (category === 'trainers') query = 'Trainer';
    if (category === 'items') query = 'Item';

    let cards = await findCards(decodedCategory);
    const rate = await getJpyToHkdRate();

    // Sorting Logic
    const getPrice = (card) => {
        if (card.priceRaw && card.currency === 'USD') {
            return card.priceRaw * 7.8;
        }
        return (card.price || 0) * 0.055; // Approx JPY to HKD
    };

    const getNumber = (card) => {
        // Extract number manually (e.g. 001/102 -> 1)
        if (!card.number) return 999999;
        const match = card.number.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : 999999;
    };

    switch (sort) {
        case 'price-desc':
            cards.sort((a, b) => getPrice(b) - getPrice(a));
            break;
        case 'price-asc':
            cards.sort((a, b) => getPrice(a) - getPrice(b));
            break;
        case 'name-asc':
            cards.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            cards.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'number-asc':
            cards.sort((a, b) => getNumber(a) - getNumber(b));
            break;
        case 'date-desc':
            cards.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
            break;
        case 'date-asc':
            cards.sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
            break;
        default:
            // Default to number asc if possible
            cards.sort((a, b) => getNumber(a) - getNumber(b));
    }

    // Filter out boxes if browsing specific pokemon
    const singles = cards.filter(c => c.cardType === 'single');

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <div style={{ marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link href="/browse" style={{ color: '#666', textDecoration: 'none' }}>← Browse</Link>
                    <span style={{ color: '#444' }}>/</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {decodedCategory}
                    </h1>
                    <span style={{ background: '#333', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: '#ccc' }}>
                        {singles.length}
                    </span>
                </div>

                <SortFilter />
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
