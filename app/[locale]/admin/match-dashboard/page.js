'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MatchDashboard.module.css';

export default function MatchDashboardPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'zh-HK';

    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null); // setCode of expanded row
    const [unmatchedMap, setUnmatchedMap] = useState({}); // setCode → card list
    const [loadingSet, setLoadingSet] = useState(null);

    // Review tab
    const [tab, setTab] = useState('progress'); // 'progress' | 'review'
    const [review, setReview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/match-stats');
            const data = await res.json();
            setStats(data.stats || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const toggleSet = async (setCode) => {
        if (expanded === setCode) { setExpanded(null); return; }
        setExpanded(setCode);
        if (unmatchedMap[setCode]) return; // already loaded
        setLoadingSet(setCode);
        try {
            const res = await fetch(`/api/admin/match-stats?setCode=${encodeURIComponent(setCode)}`);
            const data = await res.json();
            setUnmatchedMap(prev => ({ ...prev, [setCode]: data.unmatchedCards || [] }));
        } finally {
            setLoadingSet(null);
        }
    };

    const fetchReview = async () => {
        if (review) { setTab('review'); return; }
        setReviewLoading(true);
        setTab('review');
        try {
            const res = await fetch('/api/admin/match-review');
            const data = await res.json();
            setReview(data);
        } finally {
            setReviewLoading(false);
        }
    };

    const totalCards = stats.reduce((s, r) => s + r.total, 0);
    const totalMatched = stats.reduce((s, r) => s + r.matched, 0);
    const overallPct = totalCards > 0 ? Math.round((totalMatched / totalCards) * 100) : 0;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Match Dashboard</h1>

            {/* Overall summary */}
            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryNum}>{totalMatched.toLocaleString()}</span>
                    <span className={styles.summaryLabel}>已配對</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryNum}>{(totalCards - totalMatched).toLocaleString()}</span>
                    <span className={styles.summaryLabel}>未配對</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryNum}>{totalCards.toLocaleString()}</span>
                    <span className={styles.summaryLabel}>總卡數</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryNum}>{overallPct}%</span>
                    <span className={styles.summaryLabel}>整體進度</span>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === 'progress' ? styles.tabActive : ''}`}
                    onClick={() => setTab('progress')}
                >
                    配對進度
                </button>
                <button
                    className={`${styles.tab} ${tab === 'review' ? styles.tabActive : ''}`}
                    onClick={fetchReview}
                >
                    疑似 Match 錯 {review ? `(${(review.noQuote?.length || 0) + (review.priceAnomalies?.length || 0)})` : ''}
                </button>
            </div>

            {/* Progress tab */}
            {tab === 'progress' && (
                <div className={styles.tableWrap}>
                    {loading ? (
                        <p className={styles.hint}>載入中…</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Set Code</th>
                                    <th>系列名</th>
                                    <th className={styles.right}>已配對 / 總數</th>
                                    <th className={styles.right}>未配對</th>
                                    <th>進度</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map(row => {
                                    const pct = row.total > 0 ? Math.round((row.matched / row.total) * 100) : 0;
                                    const isExpanded = expanded === row.setCode;
                                    const cards = unmatchedMap[row.setCode];
                                    return (
                                        <Fragment key={row.setCode}>
                                            <tr
                                                className={`${styles.row} ${row.unmatched === 0 ? styles.rowDone : ''} ${isExpanded ? styles.rowExpanded : ''}`}
                                                onClick={() => row.unmatched > 0 && toggleSet(row.setCode)}
                                                style={{ cursor: row.unmatched > 0 ? 'pointer' : 'default' }}
                                            >
                                                <td className={styles.code}>{row.setCode || '—'}</td>
                                                <td className={styles.name}>{row.setName || '—'}</td>
                                                <td className={styles.right}>
                                                    <span className={row.matched === row.total ? styles.done : ''}>
                                                        {row.matched} / {row.total}
                                                    </span>
                                                </td>
                                                <td className={styles.right}>
                                                    {row.unmatched > 0
                                                        ? <span className={styles.unmatchedBadge}>{row.unmatched}</span>
                                                        : <span className={styles.doneTick}>✓</span>}
                                                </td>
                                                <td>
                                                    <div className={styles.barWrap}>
                                                        <div
                                                            className={styles.bar}
                                                            style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#6366f1' }}
                                                        />
                                                        <span className={styles.barPct}>{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className={styles.expandRow}>
                                                    <td colSpan={5}>
                                                        {loadingSet === row.setCode ? (
                                                            <p className={styles.hint}>載入中…</p>
                                                        ) : cards?.length === 0 ? (
                                                            <p className={styles.hint}>全部已配對</p>
                                                        ) : (
                                                            <div className={styles.unmatchedList}>
                                                                <p className={styles.unmatchedTitle}>
                                                                    未配對卡（{cards?.length} 張）— 點卡名去配對
                                                                </p>
                                                                <div className={styles.unmatchedGrid}>
                                                                    {(cards || []).map(c => (
                                                                        <Link
                                                                            key={c.id}
                                                                            href={`/${locale}/card/${encodeURIComponent(c.id)}`}
                                                                            className={styles.unmatchedCard}
                                                                            target="_blank"
                                                                        >
                                                                            <span className={styles.unmatchedName}>{c.name}</span>
                                                                            {c.number && <span className={styles.unmatchedNum}>{c.number}</span>}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Review tab */}
            {tab === 'review' && (
                <div className={styles.reviewWrap}>
                    {reviewLoading && <p className={styles.hint}>分析中…</p>}
                    {review && (
                        <>
                            {/* No quote section */}
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    有 ID 但無報價（{review.noQuote?.length || 0} 張）
                                </h2>
                                <p className={styles.sectionHint}>
                                    呢啲卡已配對 SNKRDUNK ID，但 fetch 後搵唔到任何掛單。可能係 ID 對錯咗，或該商品已下架。
                                </p>
                                {review.noQuote?.length === 0 && <p className={styles.hint}>無問題卡</p>}
                                <div className={styles.reviewGrid}>
                                    {(review.noQuote || []).map(c => (
                                        <Link
                                            key={c.id}
                                            href={`/${locale}/card/${encodeURIComponent(c.id)}`}
                                            className={styles.reviewCard}
                                            target="_blank"
                                        >
                                            <span className={styles.reviewCardName}>{c.name}</span>
                                            <span className={styles.reviewCardMeta}>{c.setCode} {c.number}</span>
                                            <span className={styles.reviewCardId}>SNK#{c.snkrdunkProductId}</span>
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* Price anomaly section */}
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>
                                    價格異常（{review.priceAnomalies?.length || 0} 張）
                                </h2>
                                <p className={styles.sectionHint}>
                                    呢啲卡嘅價格比同 set 平均貴 10 倍以上，可能係 match 錯咗去另一張貴卡。
                                </p>
                                {review.priceAnomalies?.length === 0 && <p className={styles.hint}>無異常</p>}
                                <table className={styles.reviewTable}>
                                    <thead>
                                        <tr>
                                            <th>卡名</th>
                                            <th>Set</th>
                                            <th className={styles.right}>此卡價格</th>
                                            <th className={styles.right}>Set 平均</th>
                                            <th className={styles.right}>倍數</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(review.priceAnomalies || []).map(c => (
                                            <tr key={c.id} className={styles.reviewRow}>
                                                <td>{c.name} {c.number || ''}</td>
                                                <td className={styles.code}>{c.setCode}</td>
                                                <td className={styles.right}>HK${c.snkrdunkPriceHkd?.toLocaleString()}</td>
                                                <td className={styles.right}>HK${c.setAvgHkd?.toLocaleString()}</td>
                                                <td className={styles.right}>
                                                    <span className={styles.multiplier}>
                                                        ×{Math.round(c.snkrdunkPriceHkd / c.setAvgHkd)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link
                                                        href={`/${locale}/card/${encodeURIComponent(c.id)}`}
                                                        className={styles.fixBtn}
                                                        target="_blank"
                                                    >
                                                        去改
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
