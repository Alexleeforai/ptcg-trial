export default function TrendChart({ data = [] }) {
    if (!data || data.length === 0) return null;

    const width = 300;
    const height = 60;
    const padding = 5;

    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        // Invert Y because SVG 0 is top
        const normalizedPrice = (d.price - min) / range;
        const y = height - (normalizedPrice * (height - 2 * padding) + padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Last 30 Days Trend</span>
                <span style={{ color: prices[prices.length - 1] >= prices[0] ? 'var(--success)' : 'var(--accent)' }}>
                    {prices[prices.length - 1] >= prices[0] ? '▲' : '▼'}
                </span>
            </div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={`M ${points} L ${width - padding},${height} L ${padding},${height} Z`}
                    fill="url(#gradient)"
                    stroke="none"
                />
            </svg>
        </div>
    );
}
