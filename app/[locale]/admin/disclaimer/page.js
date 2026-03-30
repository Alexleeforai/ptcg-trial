'use client';

import { useState, useEffect } from 'react';

export default function AdminDisclaimerPage() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch('/api/disclaimer')
            .then(r => r.json())
            .then(d => { setContent(d.content || ''); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch('/api/admin/disclaimer', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Save failed: ' + await res.text());
            }
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>免責聲明</h1>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '6px' }}>
                    編輯網站免責聲明內容。支援換行，內容會原樣顯示。
                </p>
            </div>

            {loading ? (
                <p style={{ color: '#6b7280' }}>Loading...</p>
            ) : (
                <>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={20}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: '#18181b', border: '1px solid #3f3f46',
                            borderRadius: '10px', padding: '16px',
                            color: '#e2e8f0', fontSize: '0.92rem',
                            lineHeight: 1.7, resize: 'vertical',
                            fontFamily: 'inherit', outline: 'none'
                        }}
                        placeholder="在此輸入免責聲明內容..."
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

                        {saved && (
                            <span style={{ color: '#22c55e', fontSize: '0.88rem' }}>✓ 已儲存</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
