'use client';

import { useState, useEffect, useCallback } from 'react';

const LANGUAGE_OPTIONS = [
    { value: '', label: '— 自動偵測 —' },
    { value: 'english', label: '🇬🇧 English' },
    { value: 'japanese', label: '🇯🇵 Japanese' },
    { value: 'chinese', label: '🇨🇳 Chinese' },
];

export default function AdminSetMetadataPage() {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [saving, setSaving] = useState(null);
    const [edits, setEdits] = useState({});
    const [search, setSearch] = useState('');
    const [filterLang, setFilterLang] = useState('');

    const fetchSets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/set-metadata');
            const data = await res.json();
            setSets(data.sets || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSets(); }, [fetchSets]);

    const handleSync = async () => {
        setSyncing(true); setSyncResult(null);
        const res = await fetch('/api/admin/set-metadata/sync', { method: 'POST' });
        const data = await res.json();
        setSyncResult(data);
        setSyncing(false);
        if (data.success) fetchSets();
    };

    const handleEdit = (setId, field, value) => {
        setEdits(prev => ({ ...prev, [setId]: { ...(prev[setId] || {}), [field]: value } }));
    };

    const handleSave = async (s) => {
        const patch = edits[s.setId] || {};
        setSaving(s.setId);
        try {
            const res = await fetch('/api/admin/set-metadata', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    setId: s.setId,
                    language:    patch.language    !== undefined ? patch.language    : s.language,
                    releaseDate: patch.releaseDate !== undefined ? patch.releaseDate : s.releaseDate,
                    coverImage:  patch.coverImage  !== undefined ? patch.coverImage  : s.coverImage,
                })
            });
            if (!res.ok) throw new Error(await res.text());
            // Merge saved values back into sets
            setSets(prev => prev.map(x => x.setId === s.setId
                ? { ...x, ...patch }
                : x
            ));
            setEdits(prev => { const n = { ...prev }; delete n[s.setId]; return n; });
        } catch (e) { alert('Save failed: ' + e.message); }
        setSaving(null);
    };

    const filtered = sets.filter(s => {
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.setId.toLowerCase().includes(search.toLowerCase());
        const matchLang = !filterLang || (s.language || '') === filterLang;
        return matchSearch && matchLang;
    });

    const cell = { padding: '8px 10px', fontSize: '0.8rem', color: '#e2e8f0', borderBottom: '1px solid #27272a', verticalAlign: 'middle' };
    const inputStyle = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', padding: '4px 8px', color: '#e2e8f0', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 1000 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>系列管理</h1>
                <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 4 }}>
                    為每個系列設定語言、發售日期及封面圖。空白欄位會自動使用卡牌圖片。
                </p>
            </div>

            {/* Sync button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, padding: '12px 16px' }}>
                <button onClick={handleSync} disabled={syncing} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', background: syncing ? '#3f3f46' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: syncing ? 'not-allowed' : 'pointer' }}>
                    {syncing ? '同步中...' : '🔄 自動同步新系列'}
                </button>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>掃描資料庫，自動新增尚未建立記錄的系列</span>
                {syncResult && (
                    <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>
                        ✓ 新增了 {syncResult.created} 個系列（共 {syncResult.total} 個）
                    </span>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋系列名稱或 ID..." style={{ ...inputStyle, flex: 1, padding: '6px 12px', fontSize: '0.85rem' }} />
                <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={{ ...inputStyle, width: 160, padding: '6px 10px' }}>
                    <option value="">All Languages</option>
                    <option value="english">🇬🇧 English</option>
                    <option value="japanese">🇯🇵 Japanese</option>
                    <option value="chinese">🇨🇳 Chinese</option>
                </select>
            </div>

            {/* Stats */}
            <div style={{ color: '#6b7280', fontSize: '0.78rem', marginBottom: 10 }}>
                顯示 {filtered.length} / {sets.length} 個系列
                {' · '}無發售日期: {sets.filter(s => !s.releaseDate).length}
                {' · '}無自訂封面: {sets.filter(s => !s.coverImage).length}
            </div>

            {/* Table */}
            {loading ? <p style={{ color: '#6b7280' }}>Loading...</p> : (
                <div style={{ overflowX: 'auto', border: '1px solid #27272a', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#18181b' }}>
                                {['系列名稱', 'Set ID', 'Cards', '語言', '發售日期', '封面圖 URL', ''].map(h => (
                                    <th key={h} style={{ ...cell, color: '#9ca3af', fontWeight: 600, textAlign: 'left', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => {
                                const patch = edits[s.setId] || {};
                                const isDirty = !!edits[s.setId] && Object.keys(edits[s.setId]).length > 0;
                                const lang = patch.language !== undefined ? patch.language : s.language;
                                const date = patch.releaseDate !== undefined ? patch.releaseDate : s.releaseDate;
                                const cover = patch.coverImage !== undefined ? patch.coverImage : s.coverImage;

                                return (
                                    <tr key={s.setId} style={{ background: isDirty ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                                        <td style={{ ...cell, fontWeight: 500, maxWidth: 200 }}>{s.name}</td>
                                        <td style={{ ...cell, color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem' }}>{s.setId}</td>
                                        <td style={{ ...cell, color: '#6b7280' }}>{s.count}</td>
                                        <td style={{ ...cell, minWidth: 130 }}>
                                            <select value={lang} onChange={e => handleEdit(s.setId, 'language', e.target.value)} style={inputStyle}>
                                                {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ ...cell, minWidth: 130 }}>
                                            <input type="date" value={date} onChange={e => handleEdit(s.setId, 'releaseDate', e.target.value)} style={inputStyle} />
                                        </td>
                                        <td style={{ ...cell, minWidth: 200 }}>
                                            <input type="text" value={cover} onChange={e => handleEdit(s.setId, 'coverImage', e.target.value)} placeholder="https://..." style={inputStyle} />
                                        </td>
                                        <td style={{ ...cell }}>
                                            <button
                                                onClick={() => handleSave(s)}
                                                disabled={!isDirty || saving === s.setId}
                                                style={{ padding: '4px 14px', borderRadius: 6, border: 'none', background: isDirty ? '#6366f1' : '#27272a', color: isDirty ? '#fff' : '#6b7280', fontWeight: 600, fontSize: '0.78rem', cursor: isDirty ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
                                            >
                                                {saving === s.setId ? '...' : 'Save'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
