'use client';

import { useState, useEffect } from 'react';
import styles from './CollectionPriceTracker.module.css';

const MAX_COPIES = 5;

// Generate random ID for client-side keys
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function CollectionPriceTracker({
    cardId,
    initialItems = [],
    initialPurchasePrice, // Legacy fallback
    prices // { raw, psa10, grade9 } in HKD
}) {
    // Initialize items: Use generic "RAW" items if initialItems is empty but legacy price exists
    const getInitialState = () => {
        if (initialItems && initialItems.length > 0) return initialItems;
        if (initialPurchasePrice && initialPurchasePrice > 0) {
            return [{ id: generateId(), price: initialPurchasePrice, grade: 'RAW' }];
        }
        return [];
    };

    const [items, setItems] = useState(getInitialState());
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success, error

    // Auto-save effect logic could be tricky with array. 
    // Instead of auto-saving on every keystroke, we save on Blur of inputs or Change of Selects.
    // Or we provide a manual "trigger" function.

    const saveToServer = async (newItems) => {
        setSaveStatus('saving');
        try {
            // Clean up data before sending: ensure prices are numbers
            const payloadItems = newItems.map(item => ({
                ...item,
                price: item.price === '' ? 0 : parseFloat(item.price)
            }));

            const res = await fetch('/api/collection/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId,
                    items: payloadItems
                })
            });

            if (!res.ok) {
                throw new Error('Save failed');
            }
            setSaveStatus('success');
            // Timeout removed: Keep 'success' state until user modifies data
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const updateItem = (id, field, value) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setItems(newItems);
        setSaveStatus('idle'); // Reset to idle (Save Changes) on any edit
    };

    const addItem = () => {
        if (items.length >= MAX_COPIES) return;
        const newItem = { id: generateId(), price: '', grade: 'RAW' }; // Default to RAW
        const newItems = [...items, newItem];
        setItems(newItems);
        setSaveStatus('idle');
    };

    const removeItem = (id) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);
        setSaveStatus('idle');
    };

    const getMarketPrice = (grade) => {
        switch (grade) {
            case 'PSA10': return prices.psa10 || 0;
            case 'GRADE9': return prices.grade9 || 0;
            default: return prices.raw || 0; // RAW
        }
    };

    // Calculate Totals
    const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const totalValue = items.reduce((sum, item) => sum + getMarketPrice(item.grade), 0);
    const totalDiff = totalValue - totalCost;
    const totalPercent = totalCost > 0 ? ((totalDiff / totalCost) * 100).toFixed(1) : 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.icon}>🏷️</span>
                <span className={styles.label}>Collection Tracker</span>
                {saveStatus === 'saving' && <span className={styles.saving}>Saving...</span>}
            </div>

            <div className={styles.rows}>
                {items.map(item => {
                    const marketPrice = getMarketPrice(item.grade);
                    const cost = parseFloat(item.price) || 0;
                    const diff = marketPrice - cost;
                    const percent = cost > 0 ? ((diff / cost) * 100).toFixed(1) : 0;

                    return (
                        <div key={item.id} className={styles.row}>
                            <select
                                value={item.grade}
                                onChange={(e) => updateItem(item.id, 'grade', e.target.value)}
                                className={styles.gradeSelect}
                            >
                                <option value="RAW">Raw</option>
                                <option value="PSA10">PSA 10</option>
                                <option value="GRADE9">Grade 9</option>
                            </select>

                            <div className={styles.inputGroup}>
                                <span className={styles.prefix}>$</span>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                    placeholder="Cost"
                                    className={styles.input}
                                />
                            </div>

                            {cost > 0 && (
                                <div className={`${styles.profitInfo} ${diff >= 0 ? styles.positive : styles.negative}`}>
                                    {diff >= 0 ? '+' : ''}{percent}%
                                </div>
                            )}

                            <button onClick={() => removeItem(item.id)} className={styles.deleteBtn} title="Remove">×</button>
                        </div>
                    );
                })}
            </div>

            {items.length < MAX_COPIES && (
                <button onClick={addItem} className={styles.addBtn}>
                    + Add Copy ({items.length}/{MAX_COPIES})
                </button>
            )}

            {items.length > 0 && totalCost > 0 && (
                <div className={styles.summary}>
                    <span>Total P/L</span>
                    <span className={totalDiff >= 0 ? styles.positive : styles.negative}>
                        {totalDiff >= 0 ? '+' : ''}${Math.abs(totalDiff).toLocaleString()} ({totalPercent}%)
                    </span>
                </div>
            )}

            <div className={styles.footer}>
                <button
                    onClick={() => saveToServer(items)}
                    className={`${styles.saveBtn} ${styles[saveStatus]}`}
                    disabled={saveStatus === 'saving' || saveStatus === 'success'}
                >
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'success' && 'Saved'}
                    {saveStatus === 'error' && 'Error!'}
                    {saveStatus === 'idle' && 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
