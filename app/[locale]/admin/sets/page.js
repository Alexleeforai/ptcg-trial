'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import styles from './Sets.module.css';

export default function AdminSetsPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [editedCodes, setEditedCodes] = useState({});

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/');
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (isSignedIn) {
            fetchSets();
        }
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
        setEditedCodes(prev => ({
            ...prev,
            [setId]: value
        }));
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

            // Update local state
            setSets(prev => prev.map(s =>
                s.id === setId ? { ...s, setCode: setCode } : s
            ));

            // Clear edited state
            setEditedCodes(prev => {
                const updated = { ...prev };
                delete updated[setId];
                return updated;
            });

            alert(`✓ Saved! Updated ${data.modifiedCount} cards`);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save set code');
        } finally {
            setSaving(null);
        }
    }

    if (!isLoaded) {
        return (
            <div suppressHydrationWarning className={`container ${styles.container}`}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div suppressHydrationWarning className={`container ${styles.container}`}>
                <div className={styles.loading}>Please sign in to access admin panel</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`container ${styles.container}`}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={`container ${styles.container}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Admin - Set Code Management</h1>
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
                            const currentCode = editedCodes.hasOwnProperty(set.id)
                                ? editedCodes[set.id]
                                : set.setCode;
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
                                            {saving === set.id ? '...' : '✓ Save'}
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
