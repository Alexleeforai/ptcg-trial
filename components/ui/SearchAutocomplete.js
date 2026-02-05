'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/navigation';
import Image from 'next/image';
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
    const [searchType, setSearchType] = useState('all');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const router = useRouter();

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
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="all">All</option>
                    <option value="setCode">Set Code</option>
                    <option value="name">Name</option>
                </select>
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
                            <Image
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
                                    <span className={`${styles.suggestionPrice} ${s.price > 0 || s.priceRaw > 0 ? '' : styles.noPrice}`}>
                                        {s.price > 0
                                            ? `HK$${Math.round(s.price * 0.055).toLocaleString()}`
                                            : s.priceRaw > 0
                                                ? `HK$${Math.round(s.priceRaw * 7.8).toLocaleString()}`
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
