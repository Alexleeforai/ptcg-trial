'use client';

import { useState } from 'react';
import styles from './Sync.module.css';

export default function AdminSyncPage() {
    // --- Google Sheets Sync State ---
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // --- PriceCharting New Sets Sync State ---
    const [pcSyncing, setPcSyncing] = useState(false);
    const [syncMode, setSyncMode] = useState(null); // 'new' or 'force'
    const [pcResult, setPcResult] = useState(null);
    const [pcError, setPcError] = useState(null);
    const [pcProgress, setPcProgress] = useState(null);

    // Existing: Google Sheets handler
    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/sync', { method: 'POST' });
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

    // New: PriceCharting new sets handler (Streamed)
    const handlePcSync = async (force = false) => {
        setPcSyncing(true);
        setSyncMode(force ? 'force' : 'new');
        setPcError(null);
        setPcResult(null);
        setPcProgress({ current: 0, total: 0, currentSet: 'Starting...' });

        try {
            const response = await fetch('/api/admin/sync-new-sets', {
                method: 'POST',
                body: JSON.stringify({ force })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let partialData = '';

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    partialData += decoder.decode(value, { stream: true });
                    const lines = partialData.split('\n\n');
                    partialData = lines.pop() || ''; // keep the last potentially incomplete chunk

                    for (const chunk of lines) {
                        if (chunk.trim() === '') continue;

                        const eventMatch = chunk.match(/event: (.+)\n/);
                        const dataMatch = chunk.match(/data: (.+)/);
                        if (eventMatch && dataMatch) {
                            const event = eventMatch[1].trim();
                            const data = JSON.parse(dataMatch[1]);

                            if (event === 'progress') {
                                setPcProgress(data);
                            } else if (event === 'complete') {
                                setPcResult(data);
                            } else if (event === 'error') {
                                setPcError(data.error);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setPcError(err.message);
        } finally {
            setPcSyncing(false);
            setSyncMode(null);
            setPcProgress(null);
        }
    };

    return (
        <div className={styles.container}>

            {/* ── Existing: Google Sheets Sync ── */}
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

            {/* ── New: PriceCharting New Sets Sync ── */}
            <div className={styles.card} style={{ marginTop: '24px' }}>
                <h1>🔍 PriceCharting Data Sync</h1>
                <p className={styles.description}>
                    自動搵出 PriceCharting 上面嘅新卡同新 Set，或者強制更新舊有資料（包括修復死圖）。
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <button
                        onClick={() => handlePcSync(false)}
                        disabled={pcSyncing}
                        className={styles.syncButton}
                        style={{ margin: 0, background: syncMode === 'new' ? undefined : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        {syncMode === 'new' && pcProgress 
                            ? `⏳ ${pcProgress.current}/${pcProgress.total} (${pcProgress.currentSet})` 
                            : '🔍 搵新 Set 並匯入'}
                    </button>

                    <button
                        onClick={() => handlePcSync(true)}
                        disabled={pcSyncing}
                        className={styles.syncButton}
                        style={{ margin: 0, background: syncMode === 'force' ? undefined : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
                    >
                        {syncMode === 'force' && pcProgress 
                            ? `⏳ ${pcProgress.current}/${pcProgress.total} (${pcProgress.currentSet})` 
                            : '🔄 強制重刷所有圖同價'}
                    </button>
                </div>

                {pcResult && (
                    <div className={styles.successBox}>
                        {pcResult.newSetsFound === 0 ? (
                            <h3>✅ {pcResult.message}</h3>
                        ) : (
                            <>
                                <h3>✅ 完成！</h3>
                                <div className={styles.stats}>
                                    <div className={styles.stat}>
                                        <span className={styles.label}>處理 Set 數:</span>
                                        <span className={styles.value}>{pcResult.newSetsFound}</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.label}>處理卡牌數:</span>
                                        <span className={styles.value}>{pcResult.totalCardsAdded}</span>
                                    </div>
                                </div>
                                {pcResult.sets && pcResult.sets.length > 0 && (
                                    <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#333' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #28a745', textAlign: 'left' }}>
                                                <th style={{ padding: '6px 8px' }}>Set 名</th>
                                                <th style={{ padding: '6px 8px' }}>卡牌數</th>
                                                <th style={{ padding: '6px 8px' }}>狀態</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pcResult.sets.map(s => (
                                                <tr key={s.setId} style={{ borderBottom: '1px solid rgba(40, 167, 69, 0.2)' }}>
                                                    <td style={{ padding: '6px 8px', fontWeight: '500' }}>{s.name}</td>
                                                    <td style={{ padding: '6px 8px' }}>{s.cardsAdded}</td>
                                                    <td style={{ padding: '6px 8px' }}>
                                                        {s.status === 'ok' ? '✅' : s.status === 'empty' ? '⚠️ 空' : `❌ ${s.error || 'Error'}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </div>
                )}

                {pcError && (
                    <div className={styles.errorBox}>
                        <h3>❌ 同步失敗</h3>
                        <p>{pcError}</p>
                    </div>
                )}

                <div className={styles.infoBox}>
                    <h3>📝 使用方法</h3>
                    <ol>
                        <li><strong>搵新 Set 並匯入</strong>：只會搵 DB 未有嘅新 Collection。</li>
                        <li><strong>強制重刷所有圖同價</strong>：會重新掃描所有 Set，修復死圖並更新最新價格（需時較長）。</li>
                        <li>自動將卡牌匯入（可能需時數分鐘，請耐心等候）。</li>
                    </ol>
                </div>
            </div>

        </div>
    );
}

