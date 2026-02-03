'use client';

import { useState } from 'react';
import styles from './Sync.module.css';

export default function AdminSyncPage() {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
            } else {
                setError(data.error || 'Sync failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1>Google Sheets Sync</h1>
                <p className={styles.description}>
                    同步 Google Sheets 嘅 Set Code 去 Database
                </p>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={styles.syncButton}
                >
                    {syncing ? '同步緊...' : '🔄 立即同步'}
                </button>

                {result && (
                    <div className={styles.successBox}>
                        <h3>✅ 同步成功！</h3>
                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.label}>成功:</span>
                                <span className={styles.value}>{result.success}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.label}>失敗:</span>
                                <span className={styles.value}>{result.failed}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.label}>總數:</span>
                                <span className={styles.value}>{result.total}</span>
                            </div>
                        </div>
                        <p className={styles.timestamp}>
                            時間: {new Date(result.timestamp).toLocaleString('zh-HK')}
                        </p>
                    </div>
                )}

                {error && (
                    <div className={styles.errorBox}>
                        <h3>❌ 同步失敗</h3>
                        <p>{error}</p>
                    </div>
                )}

                <div className={styles.infoBox}>
                    <h3>📝 使用方法</h3>
                    <ol>
                        <li>喺 <a href="https://docs.google.com/spreadsheets/d/1ySpvHw1_wtdHZV4vuWgT5FvibLxMNKyyxmlTe-MxctM" target="_blank" rel="noopener noreferrer">Google Sheet</a> 填 Set Code (Column C)</li>
                        <li>撳「立即同步」按鈕</li>
                        <li>Database 會自動更新</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
