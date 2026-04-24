'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/navigation';
import SmartImage from '@/components/SmartImage';
import Input from '@/components/ui/Input';
import CardScanner from '@/components/search/CardScanner';
import styles from './SearchAutocomplete.module.css';
import { useTranslations } from 'next-intl';
import { snkrdunkToHkd, SNKRDUNK_USD_TO_HKD } from '@/lib/currency';

export default function SearchAutocomplete({
    placeholder,
    className,
    autoFocus = false,
    onSearchSubmit
}) {
    const t = useTranslations('Hero'); // Reuse Hero translations for search
    const [query, setQuery] = useState('');
    const searchType = 'all';
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const router = useRouter();
    const [showScanner, setShowScanner] = useState(false);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            if (onSearchSubmit) {
                onSearchSubmit(query, searchType);
            } else {
                router.push(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
            }
        }
    };

    // Debounce Fetch Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 1) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&type=${searchType}`);
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        setSuggestions(data.results);
                        setShowSuggestions(true);
                    } else {
                        setShowSuggestions(false);
                    }
                } catch (e) {
                    console.error("Suggestion fetch error", e);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
                setIsLoading(false);
            }
        }, 500); // Increased debounce for scraping
        return () => clearTimeout(timer);
    }, [query, searchType]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSuggestion = (cardId) => {
        router.push(`/card/${cardId}`);
        setShowSuggestions(false);
    };

    return (
        <div className={`${styles.searchContainer} ${className}`} ref={searchRef}>
            <form onSubmit={handleSearch} className={styles.form}>
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    placeholder={placeholder || t('searchPlaceholder')}
                    icon={isLoading ? (
                        <div className={styles.spinner}></div>
                    ) : (
                        <span style={{ fontSize: '1.2rem' }}>🔍</span>
                    )}
                    className={styles.searchInput}
                    wrapperClassName={styles.innerInputWrapper}
                    autoFocus={autoFocus}
                />

            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                    {suggestions.map(s => (
                        <div
                            key={s.id}
                            className={styles.suggestionItem}
                            onClick={() => handleSelectSuggestion(s.id)}
                        >
                            <SmartImage
                                src={s.image}
                                alt={s.name}
                                className={styles.suggestionImage}
                                width={60}
                                height={84}
                                style={{ objectFit: 'cover' }}
                            />
                            <div className={styles.suggestionInfo}>
                                <div className={styles.suggestionHeader}>
                                    <span className={styles.suggestionName}>{s.name}</span>
                                    <span className={`${styles.suggestionPrice} ${s.snkrdunkProductId > 0 && s.currency !== 'USD' && s.price > 0 ? '' : styles.noPrice}`}>
                                        {s.snkrdunkProductId > 0 && s.currency !== 'USD' && s.price > 0
                                            ? `HK$${snkrdunkToHkd(s.snkrdunkPriceUsd, s.price, 0.049).toLocaleString()}`
                                            : s.snkrdunkProductId > 0 ? '—' : '未配對'
                                        }
                                    </span>
                                </div>
                                <div className={styles.suggestionMeta}>
                                    {s.nameCN && <span>{s.nameCN}</span>}
                                    {s.nameCN && s.nameEN && <span style={{ margin: '0 4px' }}>/</span>}
                                    {s.nameEN && <span>{s.nameEN}</span>}
                                    {!s.nameCN && !s.nameEN && <span>{s.set} {s.number}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showScanner && (
                <CardScanner onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
}
