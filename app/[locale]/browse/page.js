import { getBrowseCategories } from '@/lib/db';
import CategoryGrid from '@/components/browse/CategoryGrid';
import { Link } from '@/lib/navigation';

export const revalidate = 3600; // 1 hour cache

export default async function BrowsePage() {
    const categories = await getBrowseCategories();

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <div style={{ marginTop: '40px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Browse Cards</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#888' }}>Explore cards by Pokemon, Trainer, or Item type.</p>
                    <Link href="/browse/all" style={{
                        padding: '8px 16px',
                        backgroundColor: '#333',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        View All Cards &rarr;
                    </Link>
                </div>
            </div>

            <CategoryGrid categories={categories} />
        </div>
    );
}
