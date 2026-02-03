'use client';

import { useState, useEffect } from 'react';
import styles from './CurrencySelector.module.css';
import { getSupportedCurrencies } from '@/lib/currency';

export default function CurrencySelector() {
    const [currency, setCurrency] = useState('HKD');
    const [isOpen, setIsOpen] = useState(false);
    const currencies = getSupportedCurrencies();

    // Load saved currency preference
    useEffect(() => {
        const saved = localStorage.getItem('preferredCurrency');
        if (saved) {
            setCurrency(saved);
        }
    }, []);

    const handleSelect = (code) => {
        setCurrency(code);
        localStorage.setItem('preferredCurrency', code);
        setIsOpen(false);

        // Trigger a custom event for other components to listen
        window.dispatchEvent(new CustomEvent('currencyChange', { detail: { currency: code } }));
    };

    const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

    return (
        <div className={styles.selector}>
            <button
                className={styles.button}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select currency"
            >
                <span className={styles.code}>{currentCurrency.code}</span>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {currencies.map(curr => (
                        <button
                            key={curr.code}
                            className={`${styles.option} ${curr.code === currency ? styles.active : ''}`}
                            onClick={() => handleSelect(curr.code)}
                        >
                            <span className={styles.optionName}>{curr.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
