'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ExternalLinksPage() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch('/api/legal?key=external-links').then(r => r.json()).then(d => { setContent(d.content || ''); setLoading(false); }).catch(() => setLoading(false));
    }, []);
    return <LegalPage title="外部連結及第三方交易聲明 (External Links Policy)" content={content} loading={loading} />;
}

function LegalPage({ title, content, loading }) {
    return (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px', color: '#e2e8f0' }}>
            <Link href="/" style={{ color: '#9ca3af', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>← 返回首頁</Link>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{title}</h1>
            <div style={{ width: '48px', height: '3px', background: 'linear-gradient(to right, #6366f1, #8b5cf6)', borderRadius: '2px', marginBottom: '32px' }} />
            {loading ? <p style={{ color: '#6b7280' }}>Loading...</p> : content
                ? <div style={{ lineHeight: 1.8, fontSize: '0.95rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>
                : <p style={{ color: '#6b7280', fontStyle: 'italic' }}>內容尚未設定。</p>}
            <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', fontSize: '0.8rem' }}>© {new Date().getFullYear()} TCG HK Platform</div>
        </div>
    );
}
