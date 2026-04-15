'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SnkrdunkMapping.module.css';

export default function AdminSnkrdunkMappingPage() {
    const [q, setQ] = useState('');
    const [setIdFilter, setSetIdFilter] = useState('');
    const [unsetOnly, setUnsetOnly] = useState(false);
    const [autoMatchedOnly, setAutoMatchedOnly] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalInSet, setTotalInSet] = useState(null);
    const [capped, setCapped] = useState(false);
    const [selected, setSelected] = useState(null);
    const [snkrdunkId, setSnkrdunkId] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [autoResult, setAutoResult] = useState(null);
    const [err, setErr] = useState(null);
    const [autoBusy, setAutoBusy] = useState(false);
    const [autoProgress, setAutoProgress] = useState('');
    const [autoDryRun, setAutoDryRun] = useState(true);
    const [autoReplace, setAutoReplace] = useState(false);
    const [autoRunAll, setAutoRunAll] = useState(false);

    // Scan Set state
    const [scanSeedId, setScanSeedId] = useState('');
    const [scanDryRun, setScanDryRun] = useState(true);
    const [scanBusy, setScanBusy] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanErr, setScanErr] = useState(null);

    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'en';

    const canSearch = q.trim().length >= 2 || setIdFilter.trim().length >= 2 || autoMatchedOnly;
    const setIdTrim = setIdFilter.trim();
    const canAutoMatch = setIdTrim.length >= 2;

    // Ref for scrolling selected list row into view
    const listRef = useRef(null);

    const search = async () => {
        if (!canSearch) return;
        setLoading(true);
        setErr(null);
        setMsg(null);
        try {
            const params = new URLSearchParams();
            if (q.trim().length >= 2) params.set('q', q.trim());
            if (setIdFilter.trim().length >= 2) params.set('setId', setIdFilter.trim());
            if (unsetOnly) params.set('unsetOnly', '1');
            if (autoMatchedOnly) params.set('autoMatchedOnly', '1');
            const res = await fetch(`/api/admin/cards/search?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            const list = data.results || [];
            setResults(list);
            setTotal(typeof data.total === 'number' ? data.total : list.length);
            setTotalInSet(typeof data.totalInSet === 'number' ? data.totalInSet : null);
            setCapped(!!data.capped);
            if (data.hint && list.length === 0) {
                setErr(data.hint);
            } else if (list.length === 0) {
                setErr('搜尋結果為零。請確認 setCode 或 setId slug 正確，或試用其他關鍵字。');
            } else if (data.setScope?.resolvedVia === 'setCode' && data.setScope.canonicalSetId) {
                setMsg(
                    `右格當成 setCode：已揀中系列 setId「${data.setScope.canonicalSetId}」（同庫內「${data.setScope.input}」一致）。` +
                        ` 每行「未填 SNK ID」係指仲未連 SNKRDUNK 商品編號，同呢句無矛盾——要撳下面「試跑／寫入自動配對」或人手貼 ID 先有 #數字。`
                );
            } else if (data.setScope?.resolvedVia === 'setCode_direct') {
                setMsg(`右格當成 setCode「${data.setScope.input}」直接搜尋（呢批卡冇對應 setId slug）。`);
            }
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
            setTotalInSet(null);
            setCapped(false);
            setSelected(null);
        } finally {
            setLoading(false);
        }
    };

    const selectCard = useCallback((c, opts = {}) => {
        setSelected(c);
        setSnkrdunkId(c.snkrdunkProductId != null ? String(c.snkrdunkProductId) : '');
        setMsg(null);
        setErr(null);
        if (opts.scrollIntoView && listRef.current) {
            const row = listRef.current.querySelector(`[data-card-id="${CSS.escape(c.id)}"]`);
            if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, []);

    // Keyboard navigation: ← prev / → next card in list
    useEffect(() => {
        const onKey = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (!results.length) return;
            const idx = selected ? results.findIndex((c) => c.id === selected.id) : -1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = results[idx + 1];
                if (next) selectCard(next, { scrollIntoView: true });
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = results[idx - 1];
                if (prev) selectCard(prev, { scrollIntoView: true });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [results, selected, selectCard]);

    const handleConfirm = async () => {
        if (!selected) return;
        setSaving(true);
        setErr(null);
        setMsg(null);
        try {
            const pathId = encodeURIComponent(selected.id);
            const res = await fetch(`/api/admin/cards/${pathId}/snkrdunk`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            setMsg('已確認並鎖定，不會再被批次自動配對覆蓋。');
            const update = { snkrdunkAutoMatched: false };
            setResults((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...update } : r)));
            setSelected((prev) => (prev ? { ...prev, ...update } : null));
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
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
                              snkrdunkName: data.cleared ? '' : (body.snkrdunkName || r.snkrdunkName || ''),
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
                          snkrdunkName: data.cleared ? '' : (body.snkrdunkName || prev.snkrdunkName || ''),
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
            setErr('自動配對要喺上面「右邊」setId 格填至少 2 個字（例如 pokemon-japanese-mega-dream-ex 或 setCode 如 m2a），唔係左邊關鍵字格。');
            return;
        }
        const perBatch = autoRunAll ? 45 : 50;
        const ok = autoRunAll
            ? autoDryRun
                ? window.confirm(
                      `試跑「試晒」全系列（唔寫入 DB）？\nsetId: ${setIdTrim}\n會自動連續請求，每批約 ${perBatch} 張，直至掃完；期間唔好閂分頁。`
                  )
                : window.confirm(
                      `寫入「試晒」全系列？\n會自動連續請求直至掃完（每批約 ${perBatch} 張）。\n只會填「未對應」；勾咗「重跑自動」會連舊「自動」一齊重估；人手已儲存嘅唔會改。\nsetId: ${setIdTrim}`
                  )
            : autoDryRun
              ? window.confirm(
                    `試跑自動配對（唔寫入 DB）？\nsetId: ${setIdTrim}\n會用 SNKRDUNK API 逐張搜（約 0.5s/張），最多 ${perBatch} 張。`
                )
              : window.confirm(
                    `確定寫入自動配對？\n只會填「未對應」嘅卡；人手已儲存過嘅唔會改。\n勾咗「重跑自動」會連舊嘅「自動」一齊重估。\nsetId: ${setIdTrim}`
                );
        if (!ok) return;
        setAutoBusy(true);
        setAutoProgress('');
        setErr(null);
        setMsg(null);
        const BATCH_GAP_MS = 450;
        try {
            let afterMongoId = null;
            let batch = 0;
            const agg = { scanned: 0, matched: 0, skipped: 0, failed: 0 };
            const aggSkip = {
                manual_locked: 0,
                no_keyword: 0,
                no_card_index: 0,
                no_snk_results: 0,
                no_pokemon_bracket: 0,
                no_bracket_match: 0,
                multi_candidates: 0
            };
            const sampleCap = 24;
            const allSamples = [];

            const postBatch = async () => {
                const res = await fetch('/api/admin/snkrdunk-auto-match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        setId: setIdTrim,
                        maxCards: perBatch,
                        dryRun: autoDryRun,
                        replaceAuto: autoReplace,
                        ...(afterMongoId ? { afterMongoId } : {})
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || res.statusText);
                return data;
            };

            do {
                batch += 1;
                if (autoRunAll) {
                    setAutoProgress(`執行緊…第 ${batch} 批（已掃 ${agg.scanned} 張）`);
                }
                const data = await postBatch();
                agg.scanned += data.scanned;
                agg.matched += data.matched;
                agg.skipped += data.skipped;
                agg.failed += data.failed;
                if (data.skipReasons) {
                    for (const [k, v] of Object.entries(data.skipReasons)) {
                        aggSkip[k] = (aggSkip[k] || 0) + v;
                    }
                }
                for (const row of data.samples || []) {
                    if (allSamples.length < sampleCap) allSamples.push(row);
                }
                afterMongoId = data.nextAfterMongoId || null;
                if (!autoRunAll) break;
                if (!afterMongoId || data.scanned === 0) break;
                await new Promise((r) => setTimeout(r, BATCH_GAP_MS));
            } while (autoRunAll);

            const mode = autoDryRun ? '試跑' : '已寫入';
            const batchNote = autoRunAll ? `共 ${batch} 批，` : '';
            const s = `自動配對完成（${mode}）：${batchNote}累計掃 ${agg.scanned} 張，成功 ${agg.matched}，略過 ${agg.skipped}，失敗 ${agg.failed}。`;
            const ex =
                allSamples.length > 0
                    ? ` 範例：${allSamples.map((x) => (x.name || '').slice(0, 16)).join(' | ')}`
                    : '';

            const reasonLabels = {
                manual_locked: '人手已鎖定',
                no_keyword: '卡名太短（搜唔到）',
                no_card_index: '無卡號（#xxx）',
                no_snk_results: 'SNKRDUNK 搜冇結果',
                no_pokemon_bracket: 'SNKRDUNK 返回無關商品（API 限制，非 Pokemon 格式）',
                no_bracket_match: 'SNKRDUNK 有 Pokemon 格式但 setCode+卡號對唔上',
                multi_candidates: '多個候選（唔知揀邊個）'
            };
            const skipLines = Object.entries(aggSkip)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `${reasonLabels[k] || k}：${v} 張`);
            const skipDetail =
                skipLines.length > 0
                    ? `\n略過原因：${skipLines.join('、')}`
                    : '';
            setAutoResult(s + ex + skipDetail);
            if (!autoDryRun) await search();
        } catch (e) {
            setErr(e.message);
        } finally {
            setAutoBusy(false);
            setAutoProgress('');
        }
    };

    const runScanSet = async () => {
        const seed = parseInt(scanSeedId, 10);
        if (!Number.isFinite(seed) || seed <= 0) {
            setScanErr('請輸入有效嘅 SNKRDUNK 商品 ID（純數字）。');
            return;
        }
        const ok = scanDryRun
            ? window.confirm(`試跑掃描？\nSeed: ${seed}\n系統會從呢個商品出發，向前後掃描附近 ID，搵出同一 setCode 嘅所有卡。唔會寫入 DB。`)
            : window.confirm(`確定寫入掃描結果？\nSeed: ${seed}\n會自動配對所有同一 setCode 嘅卡並寫入 DB（標記「自動」，人手鎖定嘅唔會改）。`);
        if (!ok) return;
        setScanBusy(true);
        setScanErr(null);
        setScanResult(null);
        try {
            const res = await fetch('/api/admin/snkrdunk-scan-set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seedProductId: seed, dryRun: scanDryRun })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            setScanResult(data);
            if (!scanDryRun) await search();
        } catch (e) {
            setScanErr(e.message);
        } finally {
            setScanBusy(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1>SNKRDUNK 對應（Matching）</h1>
                <p className={styles.description}>
                    <strong>兩種搵卡方式：</strong>① 關鍵字（至少 2 字）搜全庫；② 填 <code>setId</code>（至少 3 字，例如 PriceCharting slug{' '}
                    <code style={{ color: '#a5b4fc' }}>pokemon-japanese-mega-dream-ex</code>）可<strong>列出成個系列</strong>
                    ，單次最多載入約 6000 張。可勾「只顯示未對應」專執未有 SNKRDUNK ID 嘅卡。
                    <br />
                    搜尋後會<strong>自動揀第一張</strong>，下面輸入框就會出現；亦可撳列表其他行切換。SNKRDUNK 網址最尾數字即商品 ID。
                    <br />
                    <strong>批次自動配對：</strong>填好 setId 後可「試跑／寫入」——用卡名搜 SNKRDUNK，再用{' '}
                    <code>[setCode 049/193]</code> 同你張卡嘅 <code>setCode</code> + 卡號對；<span style={{ color: '#fbbf24' }}>無 setCode 或一對多會略過</span>
                    。寫入後列表會顯示「自動」標籤，請你喺呢頁逐張確認／改錯。
                </p>

                <div className={styles.filtersBlock}>
                    <p className={styles.filterLegend}>
                        <strong>邊格填咩：</strong>
                        <span className={styles.legendLeft}>左格＝可選</span>，用嚟收窄（卡名、卡號等）；
                        <span className={styles.legendRight}>右格＝整套系列範圍</span>：可填{' '}
                        <strong>長 slug</strong>（例 <code>pokemon-japanese-mega-dream-ex</code>）<strong>或者</strong>庫內已填好、且<strong>全庫唯一</strong>嘅{' '}
                        <code>setCode</code>（例 <code>s2a</code>、<code>M2a</code>，最少 2 字）。批次自動配對同搜尋都會用同一套規則解析右格。
                    </p>
                    <div className={styles.searchRow}>
                        <input
                            className={styles.searchInput}
                            aria-label="關鍵字（可選）"
                            placeholder="左：可留空。有右格時＝喺該系列內再篩選"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSearch && search()}
                        />
                        <input
                            className={styles.setIdInput}
                            aria-label="系列範圍：setId slug 或唯一 setCode"
                            placeholder="右：slug 例 pokemon-japanese-mega-dream-ex；或唯一 setCode 例 M2a"
                            value={setIdFilter}
                            onChange={(e) => setSetIdFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSearch && search()}
                        />
                        <button type="button" className={styles.btn} disabled={loading || !canSearch} onClick={search}>
                            {loading ? '搜尋中…' : '搜尋'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <label className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                checked={unsetOnly}
                                onChange={(e) => { setUnsetOnly(e.target.checked); if (e.target.checked) setAutoMatchedOnly(false); }}
                            />
                            只顯示未對應 SNKRDUNK
                        </label>
                        <label className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                checked={autoMatchedOnly}
                                onChange={(e) => { setAutoMatchedOnly(e.target.checked); if (e.target.checked) setUnsetOnly(false); }}
                            />
                            只顯示自動配對（待確認）
                        </label>
                    </div>
                </div>

                <div className={styles.autoPanel}>
                    <h3 className={styles.autoTitle}>批次自動配對（同一 setId）</h3>
                    <p className={styles.autoHint}>
                        <strong>三步：</strong>① 右格填 <strong>slug 或唯一 setCode</strong> ②（可選）搜尋睇列表 ③ 撳掣。預設每請求最多一批（約 50 張）；勾<strong>試晒全系列</strong>會自動連續多批直至掃完（期間唔好閂分頁）。會 call SNKRDUNK API，每張約 0.55 秒（試跑較快）。
                    </p>
                    <p className={styles.autoSetIdLine}>
                        自動配對用你右格輸入（slug 或 setCode）：
                        <span className={setIdTrim ? styles.autoSetIdValue : styles.autoSetIdEmpty}>
                            {setIdTrim || '（未填）'}
                        </span>
                        {!canAutoMatch ? (
                            <span className={styles.autoSetIdWarn}> — 至少要 2 個字元（請填右邊 setId 格）</span>
                        ) : (
                            <span className={styles.autoSetIdOk}> — 可以撳掣</span>
                        )}
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
                        <label className={styles.checkLabel}>
                            <input type="checkbox" checked={autoRunAll} onChange={(e) => setAutoRunAll(e.target.checked)} />
                            試晒全系列（自動分批直至完；每批約 45 張）
                        </label>
                    </div>
                    <button
                        type="button"
                        className={styles.btn}
                        disabled={autoBusy}
                        onClick={runAutoMatch}
                    >
                        {autoBusy ? autoProgress || '執行緊…' : autoDryRun ? '試跑自動配對' : '寫入自動配對'}
                    </button>
                </div>

                {/* Scan Set Panel */}
                <div className={styles.autoPanel} style={{ marginTop: '16px', borderTop: '1px solid #374151', paddingTop: '16px' }}>
                    <h3 className={styles.autoTitle}>掃描 SNKRDUNK 系列（新方法 ✦）</h3>
                    <p className={styles.autoHint}>
                        <strong>用法：</strong>喺 SNKRDUNK 人手搵到<strong>任何一張</strong>同系列嘅卡（例如 <code>snkrdunk.com/en/trading-cards/730202</code>），
                        複製尾部數字貼入下面，系統會自動向前後掃描，搵出全系列所有卡。
                        比舊方法快好多（唔依賴 SNKRDUNK 關鍵字搜尋）。
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <input
                            className={styles.idInput}
                            inputMode="numeric"
                            placeholder="Seed 商品 ID，例如 730202"
                            value={scanSeedId}
                            onChange={(e) => setScanSeedId(e.target.value.replace(/\D/g, ''))}
                            style={{ width: '200px' }}
                            disabled={scanBusy}
                        />
                        <label className={styles.checkLabel}>
                            <input
                                type="checkbox"
                                checked={scanDryRun}
                                onChange={(e) => setScanDryRun(e.target.checked)}
                                disabled={scanBusy}
                            />
                            試跑（唔寫入 DB）
                        </label>
                        <button
                            type="button"
                            className={styles.btn}
                            disabled={scanBusy || !scanSeedId}
                            onClick={runScanSet}
                        >
                            {scanBusy ? '掃描中…（需時約 30-90 秒）' : scanDryRun ? '試跑掃描' : '寫入掃描結果'}
                        </button>
                    </div>
                    {scanErr && <p className={styles.error}>{scanErr}</p>}
                    {scanResult && (
                        <div className={styles.autoResultBox}>
                            <strong>掃描結果（setCode: {scanResult.setCode}）</strong>
                            <p style={{ whiteSpace: 'pre-line', margin: '4px 0 0', fontSize: '0.85rem' }}>
                                {scanResult.dryRun
                                    ? `試跑完成：喺 SNKRDUNK 搵到 ${scanResult.scannedProductIds} 張 ${scanResult.setCode} 卡\n` +
                                      `Product ID 範圍：${scanResult.minProductId} – ${scanResult.maxProductId}\n` +
                                      `卡號：${(scanResult.cardNumsFound || []).slice(0, 30).join(', ')}${(scanResult.cardNumsFound || []).length > 30 ? ` …共 ${scanResult.cardNumsFound.length} 個` : ''}\n` +
                                      `（確認係岩嘅系列後，去掉「試跑」勾再撳「寫入」）`
                                    : `寫入完成：SNKRDUNK 掃到 ${scanResult.scannedProductIds} 張卡\n` +
                                      `資料庫配對：成功 ${scanResult.matched}，人手鎖定略過 ${scanResult.skipped}，搵唔到卡號 ${scanResult.noMatch}（共 ${scanResult.dbCardsTotal} 張）`}
                            </p>
                            {scanResult.samples && scanResult.samples.length > 0 && (
                                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                                    範例：{scanResult.samples.slice(0, 8).map((s) =>
                                        scanResult.dryRun
                                            ? `${s.name.slice(0, 30)} (#${s.cardNum})`
                                            : `${s.name.slice(0, 24)} → SNK#${s.productId}`
                                    ).join(' | ')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {err && <p className={styles.error}>{err}</p>}
                {autoResult && (
                    <div className={styles.autoResultBox}>
                        <strong>自動配對結果</strong>
                        <p style={{ whiteSpace: 'pre-line', margin: '4px 0 0' }}>{autoResult}</p>
                    </div>
                )}
                {msg && (
                    <p className={styles.success} style={{ whiteSpace: 'pre-line' }}>{msg}</p>
                )}

                {selected && (
                    <div className={styles.panel} id="snkrdunk-edit-panel">
                        <h2>編輯對應</h2>
                        <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '4px' }}>
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
                        {selected.snkrdunkName ? (
                            <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '2px 0 10px' }}>
                                目前配對：
                                <a
                                    href={`https://snkrdunk.com/en/trading-cards/${selected.snkrdunkProductId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#818cf8', textDecoration: 'underline' }}
                                >
                                    {selected.snkrdunkName}
                                </a>
                            </p>
                        ) : null}
                        {selected.snkrdunkAutoMatched && selected.snkrdunkProductId ? (
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnConfirm}`}
                                disabled={saving}
                                onClick={handleConfirm}
                                style={{ marginBottom: '10px' }}
                            >
                                確認正確（鎖定）
                            </button>
                        ) : null}
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
                            <Link href={`/${locale}/card/${encodeURIComponent(selected.id)}`} className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                                查看卡頁
                            </Link>
                            <a
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                                href={
                                    snkrdunkId
                                        ? `https://snkrdunk.com/en/trading-cards/${snkrdunkId}`
                                        : `https://snkrdunk.com/en/search?keyword=${encodeURIComponent(selected.name.replace(/\s*#\d+\s*$/, '').trim())}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {snkrdunkId ? '開 SNKRDUNK 商品頁' : '搜 SNKRDUNK（人手揀）'}
                            </a>
                        </div>
                        <p className={styles.hint}>
                            對應只係「邊張 DB 卡 = SNKRDUNK 邊個商品」。清咗對應之後 cron 唔會再改張卡嘅 SNKRDUNK 價。
                            鍵盤 ← → 可切換上下張卡（焦點唔係在輸入格時）。
                        </p>
                    </div>
                )}

                {results.length > 0 && (
                    <>
                        <p className={styles.resultSummary}>
                            本頁列出 <strong>{total}</strong> 張
                            {totalInSet != null && (totalInSet > total || capped) ? (
                                <>
                                    {' '}
                                    （同條件下資料庫共 <strong>{totalInSet}</strong> 張
                                    {q.trim().length >= 2 ? '；已用左格關鍵字再篩' : ''}
                                    {capped ? '；已達單次載入上限' : ''}）
                                </>
                            ) : null}
                            {totalInSet != null && totalInSet === total && !capped && q.trim().length < 2 ? (
                                <>（已全部列出）</>
                            ) : null}
                            {' '}
                            — 撳下面一行可切換要編輯嘅卡
                        </p>
                        <p className={styles.listKeyLegend}>
                            <strong>點解仲寫「未填 SNK ID」？</strong>
                            列表尾係<strong>有冇 SNKRDUNK 商品 ID</strong>；搜尋／綠色提示只係「系列範圍揀啱」（setId／setCode），唔代表每張已自動連到
                            SNKRDUNK。要試跑或寫入<strong>批次自動配對</strong>／人手填 ID 先會變成 <code>#數字</code>。
                        </p>
                        <div className={styles.resultsScroll}>
                            <div className={styles.results} ref={listRef}>
                                {results.map((c) => (
                                    <div
                                        key={c.id}
                                        data-card-id={c.id}
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
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div>
                                                {c.name}
                                                {c.snkrdunkAutoMatched ? (
                                                    <span className={styles.badgeAuto}>自動</span>
                                                ) : null}
                                            </div>
                                            <div className={styles.meta}>
                                                {c.set} {c.number ? `• ${c.number}` : ''}
                                                {c.setCode ? ` • ${c.setCode}` : ''}
                                                {c.snkrdunkProductId ? ` • SNK #${c.snkrdunkProductId}` : ' • 未填 SNK ID'}
                                            </div>
                                            {c.snkrdunkName ? (
                                                <div className={styles.snkName}>{c.snkrdunkName}</div>
                                            ) : null}
                                        </div>
                                        <div style={{ textAlign: 'right', color: '#888', fontSize: '0.72rem', wordBreak: 'break-all', flexShrink: 0 }}>
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
