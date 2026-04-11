'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import styles from './SnkrdunkMapping.module.css';

export default function AdminSnkrdunkMappingPage() {
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [snkrdunkId, setSnkrdunkId] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);

    const search = async () => {
        setLoading(true);
        setErr(null);
        setMsg(null);
        try {
            const res = await fetch(`/api/admin/cards/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            setResults(data.results || []);
            setSelected(null);
            setSnkrdunkId('');
        } catch (e) {
            setErr(e.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const selectCard = (c) => {
        setSelected(c);
        setSnkrdunkId(c.snkrdunkProductId != null ? String(c.snkrdunkProductId) : '');
        setMsg(null);
        setErr(null);
    };

    const patch = async (body) => {
        if (!selected) return;
        setSaving(true);
        setErr(null);
        setMsg(null);
        try {
            const pathId = encodeURIComponent(selected.id);
            const res = await fetch(`/api/admin/cards/${pathId}/snkrdunk`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            setMsg(
                data.cleared
                    ? '已清除 SNKRDUNK 對應。'
                    : data.quote
                      ? `已儲存並更新報價：約 ¥${data.quote.priceJpy.toLocaleString()}（來源 ${data.quote.currency} ${data.quote.minPrice}）`
                      : body.fetchNow
                        ? '已儲存 ID，但即時拎價失敗（檢查 SNKRDUNK ID 或網絡）。'
                        : '已儲存 SNKRDUNK 商品 ID。'
            );
            setResults((prev) =>
                prev.map((r) =>
                    r.id === selected.id
                        ? {
                              ...r,
                              snkrdunkProductId: data.cleared ? null : body.snkrdunkProductId,
                              snkrdunkUpdatedAt: data.quote ? new Date().toISOString() : r.snkrdunkUpdatedAt
                          }
                        : r
                )
            );
            setSelected((prev) =>
                prev
                    ? {
                          ...prev,
                          snkrdunkProductId: data.cleared ? null : body.snkrdunkProductId
                      }
                    : null
            );
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => {
        const n = parseInt(snkrdunkId, 10);
        if (!Number.isFinite(n) || n <= 0) {
            setErr('請輸入有效嘅 SNKRDUNK 數字 ID。');
            return;
        }
        patch({ snkrdunkProductId: n, fetchNow: false });
    };

    const handleSaveAndFetch = () => {
        const n = parseInt(snkrdunkId, 10);
        if (!Number.isFinite(n) || n <= 0) {
            setErr('請輸入有效嘅 SNKRDUNK 數字 ID。');
            return;
        }
        patch({ snkrdunkProductId: n, fetchNow: true });
    };

    const handleClear = () => {
        if (!selected) return;
        if (!window.confirm(`清除「${selected.name}」嘅 SNKRDUNK 對應？`)) return;
        patch({ snkrdunkProductId: null });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1>SNKRDUNK 對應（Matching）</h1>
                <p className={styles.description}>
                    用卡名／系列關鍵字搵出資料庫入面嘅卡，再填入 SNKRDUNK 商品頁網址最尾嗰個<strong>數字 ID</strong>
                    （例如 <code style={{ color: '#a5b4fc' }}>snkrdunk.com/en/trading-cards/780928</code> →{' '}
                    <code>780928</code>）。儲存後會由每日 cron 更新 <code>price</code>；「儲存並即時拎價」會立即試抓一次。
                </p>

                <div className={styles.searchRow}>
                    <input
                        className={styles.searchInput}
                        placeholder="搜尋卡名、系列…（至少 2 字）"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && search()}
                    />
                    <button type="button" className={styles.btn} disabled={loading || q.trim().length < 2} onClick={search}>
                        {loading ? '搜尋中…' : '搜尋'}
                    </button>
                </div>

                {err && <p className={styles.error}>{err}</p>}
                {msg && <p className={styles.success}>{msg}</p>}

                {results.length > 0 && (
                    <div className={styles.results}>
                        {results.map((c) => (
                            <div
                                key={c.id}
                                role="button"
                                tabIndex={0}
                                className={`${styles.resultRow} ${selected?.id === c.id ? styles.resultRowSelected : ''}`}
                                onClick={() => selectCard(c)}
                                onKeyDown={(e) => e.key === 'Enter' && selectCard(c)}
                            >
                                <div style={{ position: 'relative', width: 48, height: 68 }}>
                                    {c.image ? (
                                        <Image
                                            src={c.image}
                                            alt=""
                                            width={48}
                                            height={68}
                                            className={styles.thumb}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className={styles.thumb} />
                                    )}
                                </div>
                                <div>
                                    <div>{c.name}</div>
                                    <div className={styles.meta}>
                                        {c.set} {c.number ? `• ${c.number}` : ''}
                                        {c.snkrdunkProductId ? ` • SNKRDUNK #${c.snkrdunkProductId}` : ' • 未對應'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', color: '#888', fontSize: '0.78rem' }}>{c.id.slice(0, 18)}…</div>
                            </div>
                        ))}
                    </div>
                )}

                {selected && (
                    <div className={styles.panel}>
                        <h2>編輯對應</h2>
                        <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '12px' }}>{selected.name}</p>
                        <label className={styles.fieldLabel}>SNKRDUNK 商品 ID（純數字）</label>
                        <input
                            className={styles.idInput}
                            inputMode="numeric"
                            value={snkrdunkId}
                            onChange={(e) => setSnkrdunkId(e.target.value.replace(/\D/g, ''))}
                            placeholder="例如 780928"
                        />
                        <div className={styles.actions}>
                            <button type="button" className={styles.btn} disabled={saving} onClick={handleSave}>
                                只儲存 ID
                            </button>
                            <button type="button" className={styles.btn} disabled={saving} onClick={handleSaveAndFetch}>
                                儲存並即時拎價
                            </button>
                            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={saving} onClick={handleClear}>
                                清除對應
                            </button>
                            <Link href={`/card/${encodeURIComponent(selected.id)}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                查看卡頁
                            </Link>
                            <a
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                                href={
                                    snkrdunkId
                                        ? `https://snkrdunk.com/en/trading-cards/${snkrdunkId}`
                                        : 'https://snkrdunk.com/en/trading-card-categories/14'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                開 SNKRDUNK
                            </a>
                        </div>
                        <p className={styles.hint}>
                            對應只係「邊張 DB 卡 = SNKRDUNK 邊個商品」；卡名唔使一致。清咗對應之後 cron 唔會再改張卡嘅 SNKRDUNK 價。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
