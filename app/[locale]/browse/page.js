import { getBrowseSets } from '@/lib/db';
import { Link } from '@/lib/navigation';

export const revalidate = 3600; // Revalidate every hour

export default async function BrowsePage() {
    // New Logic: Browse by Set
    const sets = await getBrowseSets();

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <h1 className="page-title" style={{ marginTop: '40px', marginBottom: '30px' }}>Browse by Set</h1>

            {/* Set Grid */}
            <div className="grid">
                {sets.map((set) => (
                    <Link href={`/browse/${encodeURIComponent(set.id)}`} key={set.id} style={{ textDecoration: 'none' }}>
                        <div className="card-item">
                            <div className="card-image-container">
                                {set.image ? (
                                    <img src={set.image} alt={set.name} loading="lazy" />
                                ) : (
                                    <div className="placeholder" />
                                )}
                            </div>
                            <div className="card-info">
                                <h3 className="card-name">{set.name}</h3>
                                <p className="card-price" style={{ color: '#666', fontSize: '0.9rem' }}>
                                    {set.id} • {set.count} Cards
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {sets.length === 0 && (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
                    No sets found. Database might be updating.
                </div>
            )}
        </div>
    );
}
