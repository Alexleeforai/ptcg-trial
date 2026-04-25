'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SNKRDUNK_USD_TO_HKD } from '@/lib/currency';

function extractProductId(input) {
    if (!input) return null;
    const trimmed = input.trim();
    // Pure number
    if (/^\d+$/.test(trimmed)) return trimmed;
    // SNKRDUNK URL: https://snkrdunk.com/en/trading-cards/730938 (or similar)
    const m = trimmed.match(/trading-cards\/(\d+)/);
    if (m) return m[1];
    return null;
}

export default function SnkrdunkAdminPanel({ cardId, currentProductId }) {
    const router = useRouter();
    const [input, setInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);

    const parsedId = extractProductId(input);
    const snkrUrl = parsedId
        ? `https://snkrdunk.com/en/trading-cards/${parsedId}`
        : currentProductId
          ? `https://snkrdunk.com/en/trading-cards/${currentProductId}`
          : null;

    const handleSave = async () => {
        if (!parsedId) return;
        setSaving(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch(`/api/admin/cards/${encodeURIComponent(cardId)}/snkrdunk`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ snkrdunkProductId: Number(parsedId), fetchNow: true }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            if (data.quote) {
                const hkd =
                    data.quote.priceHkd ??
                    (data.quote.priceUsd ? Math.round(data.quote.priceUsd * SNKRDUNK_USD_TO_HKD) : null);
                setResult({
                    productId: parsedId,
                    priceJpy: data.quote.priceJpy,
                    priceHkd: hkd,
                    currency: data.quote.currency,
                });
            } else {
                setResult({ productId: parsedId, noPrice: true });
            }
            setInput('');
            router.refresh();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm('確定清除此卡的 SNKRDUNK 對應？')) return;
        setSaving(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch(`/api/admin/cards/${encodeURIComponent(cardId)}/snkrdunk`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ snkrdunkProductId: null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            setResult({ cleared: true });
            router.refresh();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            marginTop: '12px',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '10px',
            background: 'rgba(99,102,241,0.06)',
            padding: '14px 16px',
            fontSize: '0.82rem',
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#a5b4fc',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                <span style={{ fontSize: '0.7rem' }}>{open ? '▼' : '▶'}</span>
                [Admin] SNKRDUNK 對應
                {currentProductId
                    ? <span style={{ color: '#6b7280', fontWeight: 400 }}>（目前 ID: {currentProductId}）</span>
                    : <span style={{ color: '#f87171', fontWeight: 400 }}>（未配對）</span>
                }
            </button>

            {open && (
                <div style={{ marginTop: '12px' }}>
                    {/* Current link */}
                    {snkrUrl && (
                        <div style={{ marginBottom: '10px' }}>
                            <a
                                href={snkrUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#818cf8', fontSize: '0.78rem', wordBreak: 'break-all' }}
                            >
                                {snkrUrl} ↗
                            </a>
                        </div>
                    )}

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
                            placeholder="貼 SNKRDUNK URL 或純數字 ID"
                            style={{
                                flex: '1',
                                minWidth: '220px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                color: '#e5e7eb',
                                fontSize: '0.82rem',
                            }}
                            onKeyDown={e => e.key === 'Enter' && parsedId && !saving && handleSave()}
                        />
                        <button
                            onClick={handleSave}
                            disabled={!parsedId || saving}
                            style={{
                                background: parsedId && !saving ? '#4f46e5' : '#374151',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                cursor: parsedId && !saving ? 'pointer' : 'not-allowed',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {saving ? '更新中…' : 'Confirm 並更新價格'}
                        </button>
                        {currentProductId && (
                            <button
                                onClick={handleClear}
                                disabled={saving}
                                style={{
                                    background: 'none',
                                    color: '#f87171',
                                    border: '1px solid rgba(248,113,113,0.4)',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '0.78rem',
                                }}
                            >
                                清除對應
                            </button>
                        )}
                    </div>

                    {/* Parsed ID preview */}
                    {input && parsedId && (
                        <div style={{ color: '#86efac', fontSize: '0.75rem', marginBottom: '6px' }}>
                            ✓ 識別 Product ID：{parsedId}
                            {' — '}
                            <a
                                href={`https://snkrdunk.com/en/trading-cards/${parsedId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#818cf8' }}
                            >
                                確認係呢張卡 ↗
                            </a>
                        </div>
                    )}
                    {input && !parsedId && (
                        <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginBottom: '6px' }}>
                            ✗ 未能識別 ID，請貼 SNKRDUNK 商品 URL 或純數字
                        </div>
                    )}

                    {/* Result */}
                    {result && !result.cleared && !result.noPrice && (
                        <div style={{ color: '#86efac', fontSize: '0.8rem', marginTop: '6px' }}>
                            ✓ 已更新！SNK#{result.productId}
                            {result.priceHkd ? ` · Raw: HK$${result.priceHkd.toLocaleString()}` : ''}
                            {result.priceJpy ? ` (¥${result.priceJpy.toLocaleString()})` : ''}
                        </div>
                    )}
                    {result?.noPrice && (
                        <div style={{ color: '#fcd34d', fontSize: '0.8rem', marginTop: '6px' }}>
                            ✓ ID 已儲存，但 SNKRDUNK 暫時無售賣價（顯示「—」）
                        </div>
                    )}
                    {result?.cleared && (
                        <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '6px' }}>
                            已清除 SNKRDUNK 對應。
                        </div>
                    )}
                    {error && (
                        <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '6px' }}>
                            ✗ {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
