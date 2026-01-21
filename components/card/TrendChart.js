'use client';

import { useState, useMemo } from 'react';

export default function TrendChart({ data = [] }) {
    const [activeRange, setActiveRange] = useState('1M');

    // Filter data based on active range
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const now = new Date();
        const cutoff = new Date();

        switch (activeRange) {
            case '1W': cutoff.setDate(now.getDate() - 7); break;
            case '1M': cutoff.setDate(now.getDate() - 30); break;
            case '6M': cutoff.setDate(now.getDate() - 180); break;
            case '1Y': cutoff.setDate(now.getDate() - 365); break;
            case 'ALL': default: return data;
        }

        return data.filter(d => new Date(d.date) >= cutoff);
    }, [data, activeRange]);

    if (!data || data.length === 0) return null;

    const width = 300;
    const height = 60;
    const padding = 5;

    // Use filteredData for drawing
    // If filteredData is empty (e.g. no data in last week), show empty state or just flat line?
    // User might prefer to see "No Data" or just the buttons.
    // Let's fallback to "No data in this range" visual or similar.
    // Actually, if we recorded today, we should have at least 1 point if range includes today.

    const displayData = filteredData.length > 0 ? filteredData : [];

    // Calculate SVG Path
    let points = '';
    let prices = [];
    let min = 0;
    let max = 0;
    let isTrendUp = true;

    if (displayData.length > 0) {
        prices = displayData.map(d => d.price);
        min = Math.min(...prices);
        max = Math.max(...prices);
        const range = max - min || 1;
        isTrendUp = prices[prices.length - 1] >= prices[0];

        if (displayData.length === 1) {
            const y = height / 2;
            points = `0,${y} ${width},${y}`;
        } else {
            points = displayData.map((d, i) => {
                const x = (i / (displayData.length - 1)) * (width - 2 * padding) + padding;
                const normalizedPrice = (d.price - min) / range;
                const y = height - (normalizedPrice * (height - 2 * padding) + padding);
                return `${x},${y}`;
            }).join(' ');
        }
    }

    return (
        <div style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Price Trend</span>
                {displayData.length > 0 && (
                    <span style={{ color: isTrendUp ? 'var(--success)' : 'var(--accent)' }}>
                        {isTrendUp ? '▲' : '▼'}
                    </span>
                )}
            </div>

            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={isTrendUp ? "var(--success)" : "var(--accent)"} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={isTrendUp ? "var(--success)" : "var(--accent)"} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {displayData.length > 0 && (
                    <>
                        <path
                            d={`M ${points}`}
                            fill="none"
                            stroke={isTrendUp ? "var(--success)" : "var(--accent)"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d={`M ${points} L ${width - padding},${height} L ${padding},${height} Z`}
                            fill="url(#gradient)"
                            stroke="none"
                        />
                    </>
                )}
            </svg>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                {['1W', '1M', '6M', '1Y'].map(range => (
                    <button
                        key={range}
                        onClick={() => setActiveRange(range)}
                        style={{
                            background: activeRange === range ? 'var(--foreground)' : 'transparent',
                            color: activeRange === range ? 'var(--background)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: activeRange === range ? '600' : '400'
                        }}
                    >
                        {range}
                    </button>
                ))}
            </div>
        </div>
    );
}
