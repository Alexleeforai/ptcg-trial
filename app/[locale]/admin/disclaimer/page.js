'use client';

import { useState, useEffect } from 'react';

const DOCS = [
    { key: 'disclaimer',     label: '免責聲明',                  sub: 'Disclaimer' },
    { key: 'tos',            label: '服務條款',                  sub: 'Terms of Service' },
    { key: 'privacy',        label: '私隱政策',                  sub: 'Privacy Policy' },
    { key: 'external-links', label: '外部連結及第三方交易聲明',  sub: 'External Links Policy' },
];

export default function AdminLegalPage() {
    const [activeKey, setActiveKey] = useState('disclaimer');
    const [contents, setContents] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load all docs on mount
    useEffect(() => {
        Promise.all(DOCS.map(d =>
            fetch(`/api/legal?key=${d.key}`).then(r => r.json()).then(data => ({ key: d.key, value: data.content || '' }))
        )).then(results => {
            const map = {};
            results.forEach(r => { map[r.key] = r.value; });
            setContents(map);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true); setSaved(false);
        try {
            const res = await fetch(`/api/legal?key=${activeKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contents[activeKey] || '' })
            });
            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
            else alert('Save failed: ' + await res.text());
        } catch (e) { alert('Error: ' + e.message); }
        finally { setSaving(false); }
    };

    const activeDoc = DOCS.find(d => d.key === activeKey);

    return (
        <div style={{ maxWidth: '860px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>法律文件管理</h1>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '6px' }}>編輯網站各項法律文件內容，支援換行，內容會原樣顯示。</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#18181b', borderRadius: '10px', padding: '4px' }}>
                {DOCS.map(d => (
                    <button
                        key={d.key}
                        onClick={() => setActiveKey(d.key)}
                        style={{
                            flex: 1, padding: '8px 6px', borderRadius: '7px', border: 'none',
                            background: activeKey === d.key ? '#3f3f46' : 'transparent',
                            color: activeKey === d.key ? '#fff' : '#9ca3af',
                            fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                            lineHeight: 1.3, transition: 'all 0.15s', textAlign: 'center'
                        }}
                    >
                        <div>{d.label}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{d.sub}</div>
                    </button>
                ))}
            </div>

            {/* Editor */}
            <textarea
                value={contents[activeKey] || ''}
                onChange={e => setContents(prev => ({ ...prev, [activeKey]: e.target.value }))}
                rows={20}
                style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#18181b', border: '1px solid #3f3f46',
                    borderRadius: '10px', padding: '16px',
                    color: '#e2e8f0', fontSize: '0.92rem',
                    lineHeight: 1.7, resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none'
                }}
                placeholder={`在此輸入「${activeDoc?.label}」內容...`}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        padding: '10px 28px', borderRadius: '8px', border: 'none',
                        background: '#6366f1', color: '#fff', fontWeight: 600,
                        fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1
                    }}
                >
                    {saving ? '儲存中...' : '儲存'}
                </button>
                {saved && <span style={{ color: '#22c55e', fontSize: '0.88rem' }}>✓ 已儲存</span>}
            </div>
        </div>
    );
}
