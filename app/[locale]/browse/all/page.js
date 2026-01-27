import { getCardsPaginated } from '@/lib/db';
import { Link } from '@/lib/navigation';
import styles from '@/components/home/TrendingSection.module.css';
import PaginateControl from '@/components/browse/PaginateControl';
import CardItem from '@/components/browse/CardItem';

// Force dynamic rendering to ensure pagination params (searchParams) work instantly
export const dynamic = 'force-dynamic';

export default async function BrowseAllPage(props) {
    const searchParams = await props.searchParams;
    const page = parseInt(searchParams.page) || 1;
    const limit = 100; // Increased to 100 per page
    const data = await getCardsPaginated(page, limit);

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <div style={{ marginTop: '40px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>All Cards</h1>
                    <p style={{ color: '#888' }}>Showing {data.cards.length} of {data.totalCards} cards</p>
                </div>
                {/* Back to Categories */}
                <Link href="/browse" style={{ textDecoration: 'underline' }}>Back to Categories</Link>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
                {data.cards.map((card) => (
                    <CardItem key={card.id} card={card} />
                ))}
            </div>

            {/* Pagination Control */}
            <PaginateControl
                currentPage={data.currentPage}
                totalPages={data.totalPages}
                baseUrl="/browse/all"
            />
        </div>
    );
}
