import { Link } from '@/lib/navigation';

export default function PaginateControl({ currentPage, totalPages, baseUrl }) {
    if (totalPages <= 1) return null;

    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
            {prevPage ? (
                <Link
                    href={`${baseUrl}?page=${prevPage}`}
                    style={btnStyle}
                >
                    &larr; Previous
                </Link>
            ) : (
                <span style={{ ...btnStyle, opacity: 0.5, cursor: 'not-allowed' }}>&larr; Previous</span>
            )}

            <span style={{ display: 'flex', alignItems: 'center' }}>
                Page {currentPage} of {totalPages}
            </span>

            {nextPage ? (
                <Link
                    href={`${baseUrl}?page=${nextPage}`}
                    style={btnStyle}
                >
                    Next &rarr;
                </Link>
            ) : (
                <span style={{ ...btnStyle, opacity: 0.5, cursor: 'not-allowed' }}>Next &rarr;</span>
            )}
        </div>
    );
}

const btnStyle = {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: '500'
};
