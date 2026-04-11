'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import styles from './SnkrdunkMapping.module.css';

export default function AdminSnkrdunkMappingPage() {
    const [q, setQ] = useState('');
    const [setIdFilter, setSetIdFilter] = useState('');
    const [unsetOnly, setUnsetOnly] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [capped, setCapped] = useState(false);
    const [selected, setSelected] = useState(null);
    const [snkrdunkId, setSnkrdunkId] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);
    const [autoBusy, setAutoBusy] = useState(false);
    const [autoDryRun, setAutoDryRun] = useState(true);
    const [autoReplace, setAutoReplace] = useState(false);

    const canSearch = q.trim().length >= 2 || setIdFilter.trim().length >= 3;
    const canAutoMatch = setIdFilter.trim().length >= 3;

    const search = async () => {
        if (!canSearch) return;
        setLoading(true);
        setErr(null);
        setMsg(null);
        try {
            const params = new URLSearchParams();
            if (q.trim().length >= 2) params.set('q', q.trim());
            if (setIdFilter.trim().length >= 3) params.set('setId', setIdFilter.trim());
            if (unsetOnly) params.set('unsetOnly', '1');
            const res = await fetch(`/api/admin/cards/search?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            const list = data.results || [];
            setResults(list);
            setTotal(typeof data.total === 'number' ? data.total : list.length);
            setCapped(!!data.capped);
            if (list.length > 0) {
                const first = list[0];
                setSelected(first);
                setSnkrdunkId(first.snkrdunkProductId != null ? String(first.snkrdunkProductId) : '');
            } else {
                setSelected(null);
                setSnkrdunkId('');
            }
        } catch (e) {
            setErr(e.message);
            setResults([]);
            setTotal(0);
            setCapped(false);
            setSelected(null);
        } finally {
            setLoading(false);
        }
    };

    const selectCard = (c) => {
        setSelected(c);
        setSnkrdunkId(c.snkrdunkProductId != null ? String(c.snkrdunkProductId) : '');
        setMsg(null);
        setErr(null);
    };

    const patch = async (body) => {
        if (!selected) return;
        setSaving(true);
        setErr(null);
        setMsg(null);
        try {
            const pathId = encodeURIComponent(selected.id);
            const res = await fetch(`/api/admin/cards/${pathId}/snkrdunk`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            setMsg(
                data.cleared
                    ? '已清除 SNKRDUNK 對應。'
                    : data.quote
                      ? `已儲存並更新報價：約 ¥${data.quote.priceJpy.toLocaleString()}（來源 ${data.quote.currency} ${data.quote.minPrice}）`
                      : body.fetchNow
                        ? '已儲存 ID，但即時拎價失敗（檢查 SNKRDUNK ID 或網絡）。'
                        : '已儲存 SNKRDUNK 商品 ID。'
            );
            setResults((prev) =>
                prev.map((r) =>
                    r.id === selected.id
                        ? {
                              ...r,
                              snkrdunkProductId: data.cleared ? null : body.snkrdunkProductId,
                              snkrdunkAutoMatched: false,
                              snkrdunkUpdatedAt: data.quote ? new Date().toISOString() : r.snkrdunkUpdatedAt
                          }
                        : r
                )
            );
            setSelected((prev) =>
                prev
                    ? {
                          ...prev,
                          snkrdunkProductId: data.cleared ? null : body.snkrdunkProductId,
                          snkrdunkAutoMatched: false
                      }
                    : null
            );
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => {
        const n = parseInt(snkrdunkId, 10);
        if (!Number.isFinite(n) || n <= 0) {
            setErr('請輸入有效嘅 SNKRDUNK 數字 ID。');
            return;
        }
        patch({ snkrdunkProductId: n, fetchNow: false });
    };

    const handleSaveAndFetch = () => {
        const n = parseInt(snkrdunkId, 10);
        if (!Number.isFinite(n) || n <= 0) {
            setErr('請輸入有效嘅 SNKRDUNK 數字 ID。');
            return;
        }
        patch({ snkrdunkProductId: n, fetchNow: true });
    };

    const handleClear = () => {
        if (!selected) return;
        if (!window.confirm(`清除「${selected.name}」嘅 SNKRDUNK 對應？`)) return;
        patch({ snkrdunkProductId: null });
    };

    const runAutoMatch = async () => {
        if (!canAutoMatch) {
            setErr('自動配對要填 setId（至少 3 字），同你搜尋用嘅第二格一樣。');
            return;
        }
        const ok = autoDryRun
            ? window.confirm(
                  `試跑自動配對（唔寫入 DB）？\nsetId: ${setIdFilter.trim()}\n會用 SNKRDUNK API 逐張搜（約 0.5s/張），最多 50 張。`
              )
            : window.confirm(
                  `確定寫入自動配對？\n只會填「未對應」嘅卡；人手已儲存過嘅唔會改。\n勾咗「重跑自動」會連舊嘅「自動」一齊重估。\nsetId: ${setIdFilter.trim()}`
              );
        if (!ok) return;
        setAutoBusy(true);
        setErr(null);
        setMsg(null);
        try {
            const res = await fetch('/api/admin/snkrdunk-auto-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    setId: setIdFilter.trim(),
                    maxCards: 50,
                    dryRun: autoDryRun,
                    replaceAuto: autoReplace
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            const s = `自動配對完成（${autoDryRun ? '試跑' : '已寫入'}）：掃 ${data.scanned} 張，成功 ${data.matched}，略過 ${data.skipped}，失敗 ${data.failed}。`;
            setMsg(s + (data.samples?.length ? ` 範例：${data.samples.map((x) => x.name.slice(0, 16)).join(' | ')}` : ''));
            if (!autoDryRun) await search();
        } catch (e) {
            setErr(e.message);
        } finally {
            setAutoBusy(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1>SNKRDUNK 對應（Matching）</h1>
                <p className={styles.description}>
                    <strong>兩種搵卡方式：</strong>① 關鍵字（至少 2 字）搜全庫；② 填 <code>setId</code>（至少 3 字，例如 PriceCharting slug{' '}
                    <code style={{ color: '#a5b4fc' }}>pokemon-japanese-mega-dream-ex</code>）可<strong>列出成個系列</strong>
                    ，最多 200 張。可勾「只顯示未對應」專執未有 SNKRDUNK ID 嘅卡。
                    <br />
                    搜尋後會<strong>自動揀第一張</strong>，下面輸入框就會出現；亦可撳列表其他行切換。SNKRDUNK 網址最尾數字即商品 ID。
                    <br />
                    <strong>批次自動配對：</strong>填好 setId 後可「試跑／寫入」——用卡名搜 SNKRDUNK，再用{' '}
                    <code>[setCode 049/193]</code> 同你張卡嘅 <code>setCode</code> + 卡號對；<span style={{ color: '#fbbf24' }}>無 setCode 或一對多會略過</span>
                    。寫入後列表會顯示「自動」標籤，請你喺呢頁逐張確認／改錯。
                </p>

                <div className={styles.filtersBlock}>
                    <div className={styles.searchRow}>
                        <input
                            className={styles.searchInput}
                            placeholder="關鍵字：卡名、系列、m2a…（可同 setId 一齊用）"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSearch && search()}
                        />
                        <input
                            className={styles.setIdInput}
                            placeholder="setId：pokemon-japanese-mega-dream-ex"
                            value={setIdFilter}
                            onChange={(e) => setSetIdFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSearch && search()}
                        />
                        <button type="button" className={styles.btn} disabled={loading || !canSearch} onClick={search}>
                            {loading ? '搜尋中…' : '搜尋'}
                        </button>
                    </div>
                    <label className={styles.checkLabel}>
                        <input
                            type="checkbox"
                            checked={unsetOnly}
                            onChange={(e) => setUnsetOnly(e.target.checked)}
                        />
                        只顯示未對應 SNKRDUNK（可單用關鍵字，或同 setId 一齊用）
                    </label>
                </div>

                <div className={styles.autoPanel}>
                    <h3 className={styles.autoTitle}>批次自動配對（同一 setId）</h3>
                    <p className={styles.autoHint}>
                        先用上面 setId 搜一次確認 list 啱。自動配對會 call SNKRDUNK API，每張約 0.55 秒，每次最多 50 張。
                    </p>
                    <div className={styles.autoRow}>
                        <label className={styles.checkLabel}>
                            <input type="checkbox" checked={autoDryRun} onChange={(e) => setAutoDryRun(e.target.checked)} />
                            試跑（唔寫入 DB，只睇結果）
                        </label>
                        <label className={styles.checkLabel}>
                            <input type="checkbox" checked={autoReplace} onChange={(e) => setAutoReplace(e.target.checked)} />
                            重跑舊嘅「自動」對應（唔會改人手已儲存嘅）
                        </label>
                    </div>
                    <button
                        type="button"
                        className={styles.btn}
                        disabled={autoBusy || !canAutoMatch}
                        onClick={runAutoMatch}
                    >
                        {autoBusy ? '執行緊…' : autoDryRun ? '試跑自動配對' : '寫入自動配對'}
                    </button>
                </div>

                {err && <p className={styles.error}>{err}</p>}
                {msg && <p className={styles.success}>{msg}</p>}

                {selected && (
                    <div className={styles.panel} id="snkrdunk-edit-panel">
                        <h2>編輯對應</h2>
                        <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '12px' }}>
                            {selected.name}
                            {selected.snkrdunkAutoMatched ? (
                                <span className={styles.badgeAuto}>自動—請確認</span>
                            ) : null}
                            {selected.setId ? (
                                <span style={{ color: '#666', display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>
                                    setId: {selected.setId}
                                    {selected.setCode ? ` · setCode: ${selected.setCode}` : ''}
                                </span>
                            ) : null}
                        </p>
                        <label className={styles.fieldLabel}>SNKRDUNK 商品 ID（純數字）</label>
                        <input
                            className={styles.idInput}
                            inputMode="numeric"
                            value={snkrdunkId}
                            onChange={(e) => setSnkrdunkId(e.target.value.replace(/\D/g, ''))}
                            placeholder="例如 780928"
                        />
                        <div className={styles.actions}>
                            <button type="button" className={styles.btn} disabled={saving} onClick={handleSave}>
                                只儲存 ID
                            </button>
                            <button type="button" className={styles.btn} disabled={saving} onClick={handleSaveAndFetch}>
                                儲存並即時拎價
                            </button>
                            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={saving} onClick={handleClear}>
                                清除對應
                            </button>
                            <Link href={`/card/${encodeURIComponent(selected.id)}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                查看卡頁
                            </Link>
                            <a
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                                href={
                                    snkrdunkId
                                        ? `https://snkrdunk.com/en/trading-cards/${snkrdunkId}`
                                        : 'https://snkrdunk.com/en/trading-card-categories/14'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                開 SNKRDUNK
                            </a>
                        </div>
                        <p className={styles.hint}>
                            對應只係「邊張 DB 卡 = SNKRDUNK 邊個商品」。清咗對應之後 cron 唔會再改張卡嘅 SNKRDUNK 價。
                        </p>
                    </div>
                )}

                {results.length > 0 && (
                    <>
                        <p className={styles.resultSummary}>
                            共 <strong>{total}</strong> 張符合
                            {capped ? '（已截斷顯示上限）' : ''} — 撳下面一行可切換要編輯嘅卡
                        </p>
                        <div className={styles.resultsScroll}>
                            <div className={styles.results}>
                                {results.map((c) => (
                                    <div
                                        key={c.id}
                                        role="button"
                                        tabIndex={0}
                                        className={`${styles.resultRow} ${selected?.id === c.id ? styles.resultRowSelected : ''}`}
                                        onClick={() => selectCard(c)}
                                        onKeyDown={(e) => e.key === 'Enter' && selectCard(c)}
                                    >
                                        <div style={{ position: 'relative', width: 48, height: 68 }}>
                                            {c.image ? (
                                                <Image
                                                    src={c.image}
                                                    alt=""
                                                    width={48}
                                                    height={68}
                                                    className={styles.thumb}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className={styles.thumb} />
                                            )}
                                        </div>
                                        <div>
                                            <div>
                                                {c.name}
                                                {c.snkrdunkAutoMatched ? (
                                                    <span className={styles.badgeAuto}>自動</span>
                                                ) : null}
                                            </div>
                                            <div className={styles.meta}>
                                                {c.set} {c.number ? `• ${c.number}` : ''}
                                                {c.setCode ? ` • ${c.setCode}` : ''}
                                                {c.snkrdunkProductId ? ` • SNKRDUNK #${c.snkrdunkProductId}` : ' • 未對應'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', color: '#888', fontSize: '0.72rem', wordBreak: 'break-all' }}>
                                            {c.id.length > 22 ? `${c.id.slice(0, 22)}…` : c.id}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
