'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to get global selected currency
 */
export function useCurrency() {
    const [currency, setCurrency] = useState('HKD'); // Default

    useEffect(() => {
        // Load initial
        const saved = localStorage.getItem('preferredCurrency');
        if (saved) setCurrency(saved);

        // Listen for changes (from Header)
        const handleCurrencyChange = (e) => {
            if (e.detail?.currency) {
                setCurrency(e.detail.currency);
            }
        };

        window.addEventListener('currencyChange', handleCurrencyChange);

        // Also listen to storage events (cross-tab)
        const handleStorage = (e) => {
            if (e.key === 'preferredCurrency' && e.newValue) {
                setCurrency(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('currencyChange', handleCurrencyChange);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return currency;
}
