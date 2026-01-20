'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/navigation';
import Input from '@/components/ui/Input';
import styles from './SearchAutocomplete.module.css';
import { useTranslations } from 'next-intl';

export default function SearchAutocomplete({
    placeholder,
    className,
    autoFocus = false,
    onSearchSubmit
}) {
    const t = useTranslations('Hero'); // Reuse Hero translations for search
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const router = useRouter();

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            if (onSearchSubmit) {
                onSearchSubmit(query);
            } else {
                router.push(`/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    // Debounce Fetch Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 1) {
                try {
                    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        setSuggestions(data.results);
                        setShowSuggestions(true);
                    } else {
                        setShowSuggestions(false);
                    }
                } catch (e) {
                    console.error("Suggestion fetch error", e);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

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
                    icon={<span style={{ fontSize: '1.2rem' }}>🔍</span>}
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
                            <img src={s.image} alt={s.name} className={styles.suggestionImage} />
                            <div className={styles.suggestionInfo}>
                                <div className={styles.suggestionHeader}>
                                    <span className={styles.suggestionName}>{s.name}</span>
                                    <span className={`${styles.suggestionPrice} ${s.price > 0 ? '' : styles.noPrice}`}>
                                        {s.price > 0
                                            ? `HK$${Math.round(s.price * 0.055).toLocaleString()}`
                                            : 'HK$ ---'
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
        </div>
    );
}
