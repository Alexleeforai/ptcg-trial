'use client';

import { useState } from 'react';
import CollectionCard from './CollectionCard';
import styles from './CollectionView.module.css';

const LANGUAGES = [
    { key: 'all',      label: 'All' },
    { key: 'japanese', label: '日文' },
    { key: 'english',  label: 'English' },
    { key: 'chinese',  label: '中文' },
    { key: 'korean',   label: '한국어' },
];

// Mirror of resolveLanguage from db.js — runs client-side on the already-fetched data
function resolveLanguage(setId, setName, metaMap) {
    const meta = metaMap?.[setId];
    if (meta?.language) return meta.language;
    const name = setName || '';
    if (/japanese/i.test(name)) return 'japanese';
    if (/chinese|traditional|simplified/i.test(name)) return 'chinese';
    if (/korean/i.test(name)) return 'korean';
    return 'english';
}

export default function CollectionView({ collection, rate, metaMap = {} }) {
    const [lang, setLang] = useState('all');

    // Attach language to every card
    const enriched = collection.map(card => ({
        ...card,
        language: resolveLanguage(card.setId, card.set, metaMap),
    }));

    const filtered = lang === 'all'
        ? enriched
        : enriched.filter(c => c.language === lang);

    // Count per language for badge
    const counts = {};
    enriched.forEach(c => {
        counts[c.language] = (counts[c.language] || 0) + 1;
    });

    return (
        <div>
            {/* Language Filter Tabs */}
            <div className={styles.langTabs}>
                {LANGUAGES.map(({ key, label }) => {
                    const cnt = key === 'all' ? enriched.length : (counts[key] || 0);
                    return (
                        <button
                            key={key}
                            className={`${styles.langTab} ${lang === key ? styles.active : ''}`}
                            onClick={() => setLang(key)}
                        >
                            {label}
                            {cnt > 0 && <span className={styles.badge}>{cnt}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className={styles.empty}>
                    <span>No {lang} cards in your collection yet.</span>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((card) => (
                        <CollectionCard
                            key={card.id}
                            cardId={card.id}
                            name={card.name}
                            image={card.image}
                            set={card.set}
                            priceJpy={card.price}
                            priceRawUsd={card.priceRaw}
                            pricePSA10={card.pricePSA10}
                            currency={card.currency}
                            rate={rate}
                            initialPurchasePrice={card.purchasePrice}
                            items={card.items}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
