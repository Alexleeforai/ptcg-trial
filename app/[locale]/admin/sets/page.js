'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import styles from './Sets.module.css';

function GoogleSheetsSync() {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        setResult(null);
        try {
            const response = await fetch('/api/sync', { method: 'POST' });
            const data = await response.json();
            if (data.success) setResult(data);
            else setError(data.error || 'Sync failed');
        } catch (err) {
            setError(err.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '1.6rem 2rem',
            marginBottom: '28px',
        }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f1f1', marginBottom: '4px' }}>
                Google Sheets Sync
            </h2>
            <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                同步 Google Sheets 嘅 Set Code 去 Database
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    style={{
                        padding: '0.6rem 1.4rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        background: syncing ? '#333' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: syncing ? 'not-allowed' : 'pointer',
                        opacity: syncing ? 0.6 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {syncing ? '同步緊...' : '立即同步'}
                </button>

                <a
                    href="https://docs.google.com/spreadsheets/d/1ySpvHw1_wtdHZV4vuWgT5FvibLxMNKyyxmlTe-MxctM"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.82rem', color: '#818cf8', textDecoration: 'underline' }}
                >
                    開啟 Google Sheet
                </a>
            </div>

            {result && (
                <div style={{ marginTop: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.88rem', color: '#22c55e' }}>
                    同步成功 — 成功: {result.success} / 失敗: {result.failed} / 總數: {result.total}
                </div>
            )}
            {error && (
                <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.88rem', color: '#f87171' }}>
                    同步失敗：{error}
                </div>
            )}
        </div>
    );
}

export default function AdminSetsPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [editedCodes, setEditedCodes] = useState({});

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.push('/');
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (isSignedIn) fetchSets();
    }, [isSignedIn]);

    async function fetchSets() {
        try {
            const res = await fetch('/api/admin/sets');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setSets(data.sets);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sets:', error);
            setLoading(false);
        }
    }

    function handleCodeChange(setId, value) {
        setEditedCodes(prev => ({ ...prev, [setId]: value }));
    }

    async function saveSetCode(setId) {
        const setCode = editedCodes[setId];
        setSaving(setId);
        try {
            const res = await fetch('/api/admin/sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setId, setCode })
            });
            if (!res.ok) throw new Error('Failed to save');
            const data = await res.json();
            setSets(prev => prev.map(s => s.id === setId ? { ...s, setCode } : s));
            setEditedCodes(prev => {
                const updated = { ...prev };
                delete updated[setId];
                return updated;
            });
            alert(`Saved! Updated ${data.modifiedCount} cards`);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save set code');
        } finally {
            setSaving(null);
        }
    }

    if (!isLoaded) return <div className={`container ${styles.container}`}><div className={styles.loading}>Loading...</div></div>;
    if (!isSignedIn) return <div className={`container ${styles.container}`}><div className={styles.loading}>Please sign in to access admin panel</div></div>;
    if (loading) return <div className={`container ${styles.container}`}><div className={styles.loading}>Loading...</div></div>;

    return (
        <div className={`container ${styles.container}`}>
            {/* Google Sheets Sync — at top */}
            <GoogleSheetsSync />

            <div className={styles.header}>
                <h1 className={styles.title}>Pack Code Management</h1>
                <p className={styles.subtitle}>
                    Edit official set codes (e.g., m1L, CLB, s8a) for card sets
                </p>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Set Name</th>
                            <th>Set ID</th>
                            <th>Set Code</th>
                            <th>Cards</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sets.map((set) => {
                            const currentCode = editedCodes.hasOwnProperty(set.id) ? editedCodes[set.id] : set.setCode;
                            const hasChanges = editedCodes.hasOwnProperty(set.id);
                            return (
                                <tr key={set.id} className={hasChanges ? styles.edited : ''}>
                                    <td className={styles.setName}>{set.name}</td>
                                    <td className={styles.setId}>{set.id}</td>
                                    <td>
                                        <input
                                            type="text"
                                            value={currentCode}
                                            onChange={(e) => handleCodeChange(set.id, e.target.value)}
                                            className={styles.input}
                                            placeholder="e.g., m1L"
                                            maxLength={10}
                                        />
                                    </td>
                                    <td className={styles.count}>{set.count}</td>
                                    <td>
                                        <button
                                            onClick={() => saveSetCode(set.id)}
                                            disabled={!hasChanges || saving === set.id}
                                            className={styles.saveBtn}
                                        >
                                            {saving === set.id ? '...' : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className={styles.footer}>
                <p>Total Sets: {sets.length}</p>
            </div>
        </div>
    );
}
