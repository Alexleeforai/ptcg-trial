'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const LANGUAGE_OPTIONS = [
    { value: '', label: '— 自動偵測 —' },
    { value: 'english', label: '🇬🇧 English' },
    { value: 'japanese', label: '🇯🇵 Japanese' },
    { value: 'chinese', label: '🇨🇳 Chinese' },
];

// ─── Focal Point Picker Modal ────────────────────────────────────────────────
function FocalPointPicker({ imageUrl, initialPosition = '50% 50%', onApply, onClose }) {
    const parsePos = (pos) => {
        const [x, y] = (pos || '50% 50%').replace(/%/g, '').split(' ').map(Number);
        return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
    };

    const [pos, setPos] = useState(() => parsePos(initialPosition));
    const containerRef = useRef(null);

    const handleClick = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    };

    // Drag support
    const dragging = useRef(false);
    const onMouseDown = (e) => { dragging.current = true; handleClick(e); };
    const onMouseMove = (e) => { if (dragging.current) handleClick(e); };
    const onMouseUp = () => { dragging.current = false; };

    useEffect(() => {
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, []);

    const posStr = `${pos.x}% ${pos.y}%`;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#18181b', borderRadius: 16, padding: 28, width: 480, border: '1px solid #3f3f46' }}>
                <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>封面焦點設定</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: 20 }}>
                    點擊或拖曳圖片，選擇你想要顯示的焦點位置。十字代表目前焦點。
                </p>

                {/* Preview: matches Browse card aspect ratio */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                    {/* Full image with crosshair */}
                    <div
                        ref={containerRef}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        style={{
                            flex: 2, aspectRatio: '1/1', position: 'relative', overflow: 'hidden',
                            borderRadius: 10, cursor: 'crosshair', border: '2px solid #6366f1',
                            userSelect: 'none'
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: posStr, pointerEvents: 'none', display: 'block' }} />
                        {/* Crosshair */}
                        <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                            <div style={{ width: 20, height: 2, background: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                            <div style={{ width: 2, height: 20, background: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', background: 'rgba(99,102,241,0.7)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                        </div>
                    </div>

                    {/* Browse card preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-start' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.72rem', margin: 0 }}>Browse 預覽</p>
                        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', border: '1px solid #3f3f46' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: posStr, display: 'block' }} />
                        </div>
                    </div>
                </div>

                {/* Position display */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>X 位置: {pos.x}%</label>
                        <input type="range" min="0" max="100" value={pos.x} onChange={e => setPos(p => ({ ...p, x: +e.target.value }))}
                            style={{ width: '100%', accentColor: '#6366f1' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>Y 位置: {pos.y}%</label>
                        <input type="range" min="0" max="100" value={pos.y} onChange={e => setPos(p => ({ ...p, y: +e.target.value }))}
                            style={{ width: '100%', accentColor: '#6366f1' }} />
                    </div>
                </div>

                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#fbbf24' }}>
                    ⚠️ 套用後記得回到表格按 <strong>Save</strong> 才會真正儲存到資料庫。
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #3f3f46', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>
                        取消
                    </button>
                    <button onClick={() => { onApply(posStr); onClose(); }}
                        style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                        套用
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminSetMetadataPage() {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [saving, setSaving] = useState(null);
    const [uploading, setUploading] = useState(null);
    const [edits, setEdits] = useState({});
    const [search, setSearch] = useState('');
    const [filterLang, setFilterLang] = useState('');
    const [pickerSet, setPickerSet] = useState(null); // set being focal-pointed

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

    const handleUpload = async (setId, file) => {
        if (!file) return;
        setUploading(setId);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
            if (!res.ok) throw new Error(await res.text());
            const { url } = await res.json();
            handleEdit(setId, 'coverImage', url);
        } catch (e) { alert('Upload failed: ' + e.message); }
        setUploading(null);
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
                    language:            patch.language            !== undefined ? patch.language            : s.language,
                    releaseDate:         patch.releaseDate         !== undefined ? patch.releaseDate         : s.releaseDate,
                    coverImage:          patch.coverImage          !== undefined ? patch.coverImage          : s.coverImage,
                    coverImagePosition:  patch.coverImagePosition  !== undefined ? patch.coverImagePosition  : s.coverImagePosition,
                })
            });
            if (!res.ok) throw new Error(await res.text());
            setSets(prev => prev.map(x => x.setId === s.setId ? { ...x, ...patch } : x));
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

    // Get the current coverImage for a set (considering unsaved edits)
    const getCover = (s) => {
        const patch = edits[s.setId] || {};
        return patch.coverImage !== undefined ? patch.coverImage : s.coverImage;
    };
    const getPosition = (s) => {
        const patch = edits[s.setId] || {};
        return patch.coverImagePosition !== undefined ? patch.coverImagePosition : (s.coverImagePosition || '50% 50%');
    };

    return (
        <div style={{ maxWidth: 1000 }}>
            {/* Focal Point Picker Modal */}
            {pickerSet && (
                <FocalPointPicker
                    imageUrl={getCover(pickerSet)}
                    initialPosition={getPosition(pickerSet)}
                    onApply={(pos) => handleEdit(pickerSet.setId, 'coverImagePosition', pos)}
                    onClose={() => setPickerSet(null)}
                />
            )}

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>系列管理</h1>
                <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 4 }}>
                    為每個系列設定語言、發售日期及封面圖。空白欄位會自動使用卡牌圖片。
                </p>
            </div>

            {/* Sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, padding: '12px 16px' }}>
                <button onClick={handleSync} disabled={syncing} style={{ padding: '7px 20px', borderRadius: 8, border: 'none', background: syncing ? '#3f3f46' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: syncing ? 'not-allowed' : 'pointer' }}>
                    {syncing ? '同步中...' : '🔄 自動同步新系列'}
                </button>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>掃描資料庫，自動新增尚未建立記錄的系列</span>
                {syncResult && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>✓ 新增了 {syncResult.created} 個系列（共 {syncResult.total} 個）</span>}
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
                顯示 {filtered.length} / {sets.length} 個系列 · 無發售日期: {sets.filter(s => !s.releaseDate).length} · 無自訂封面: {sets.filter(s => !s.coverImage).length}
            </div>

            {/* Table */}
            {loading ? <p style={{ color: '#6b7280' }}>Loading...</p> : (
                <div style={{ overflowX: 'auto', border: '1px solid #27272a', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#18181b' }}>
                                {['系列名稱', 'Set ID', 'Cards', '語言', '發售日期', '封面', ''].map(h => (
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
                                const cover = getCover(s);
                                const position = getPosition(s);

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
                                        <td style={{ ...cell, minWidth: 130 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {/* Thumbnail → click to open focal point picker */}
                                                {cover ? (
                                                    <div
                                                        onClick={() => setPickerSet(s)}
                                                        title="點擊調整焦點"
                                                        style={{ width: 30, height: 42, borderRadius: 4, overflow: 'hidden', border: '1px solid #6366f1', cursor: 'pointer', flexShrink: 0, position: 'relative' }}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position }} />
                                                    </div>
                                                ) : null}
                                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: '#3f3f46', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                                    {uploading === s.setId ? '上傳中...' : (cover ? '換圖' : '📷 上傳')}
                                                    <input type="file" accept="image/*" style={{ display: 'none' }}
                                                        onChange={e => handleUpload(s.setId, e.target.files[0])}
                                                        disabled={uploading === s.setId}
                                                    />
                                                </label>
                                            </div>
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
