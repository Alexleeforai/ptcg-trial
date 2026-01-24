import { getBrowseCategories } from '@/lib/db';
import CategoryGrid from '@/components/browse/CategoryGrid';

export const revalidate = 3600; // 1 hour cache

export default async function BrowsePage() {
    const categories = await getBrowseCategories();

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <div style={{ marginTop: '40px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Browse Cards</h1>
                <p style={{ color: '#888' }}>Explore cards by Pokemon, Trainer, or Item type.</p>
            </div>

            <CategoryGrid categories={categories} />
        </div>
    );
}
