
'use client';

import { useState, useEffect } from 'react';
import styles from './AddListingModal.module.css'; // New dedicated Premium Styles
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';

const CONDITIONS = ['Raw', 'PSA 10', 'PSA 9'];

export default function AddListingModal({ isOpen, onClose, onListingAdded, initialData = null }) {
    const isEditMode = !!initialData; // Derived immediately

    const [step, setStep] = useState(isEditMode ? 3 : 1);
    const [sets, setSets] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);

    // Selections - Initialize from initialData if present
    const [selectedSet, setSelectedSet] = useState(() => {
        if (initialData) return { name: initialData.set };
        return null;
    });

    const [selectedCard, setSelectedCard] = useState(() => {
        if (initialData) {
            return {
                id: initialData.id,
                name: initialData.name,
                number: initialData.number || '',
                image: initialData.image
            };
        }
        return null;
    });

    const [listingDetails, setListingDetails] = useState(() => {
        if (initialData) {
            return {
                condition: initialData.condition || 'Raw',
                price: initialData.mySell,
                stock: initialData.stock
            };
        }
        return {
            condition: 'Raw',
            price: '',
            stock: '1'
        };
    });

    // Fetch Sets on Open (only if not edit mode or just to populate background)
    useEffect(() => {
        if (isOpen && sets.length === 0 && !isEditMode) {
            fetchSets();
        }
    }, [isOpen, isEditMode]);

    const fetchSets = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sets');
            if (res.ok) {
                const data = await res.json();
                setSets(data);
            }
        } catch (error) {
            console.error('Error fetching sets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetSelect = async (set) => {
        setSelectedSet(set);
        setSelectedCard(null); // Reset card when set changes
        setLoading(true);
        try {
            const res = await fetch(`/api/cards?setId=${set.id}`);
            if (res.ok) {
                const data = await res.json();
                setCards(data);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardSelect = (card) => {
        setSelectedCard(card);
    };

    const handleSubmit = async () => {
        if (!listingDetails.price || !listingDetails.stock) {
            alert('Please enter price and stock');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/merchant/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: selectedCard.id,
                    condition: listingDetails.condition,
                    price: parseFloat(listingDetails.price),
                    stock: parseInt(listingDetails.stock)
                })
            });

            if (res.ok) {
                onListingAdded();
                handleClose();
            } else {
                alert('Failed to save listing');
            }
        } catch (error) {
            console.error('Error saving listing:', error);
            alert('Error saving listing');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedSet(null);
        setSelectedCard(null);
        setListingDetails({ condition: 'Raw', price: '', stock: '1' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2>{isEditMode ? 'Edit Listing' : 'Add New Listing'}</h2>
                    <button onClick={handleClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formPanel}>

                        {/* Steps 1 & 2 only in Add Mode */}
                        {!isEditMode && (
                            <>
                                {/* Step 1: Select Set */}
                                <div className={styles.formGroup}>
                                    <label>Select Set</label>
                                    {loading && sets.length === 0 ? <p>Loading sets...</p> : (
                                        <select
                                            className={styles.modalInput}
                                            onChange={(e) => {
                                                const set = sets.find(s => s.id === e.target.value);
                                                handleSetSelect(set);
                                            }}
                                            value={selectedSet ? selectedSet.id : ''}
                                        >
                                            <option value="">-- Choose a Set --</option>
                                            {sets.map(set => (
                                                <option key={set.id} value={set.id}>
                                                    {set.name} {set.code ? `(${set.code})` : ''} ({set.count})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Step 2: Select Card (Only if Set selected) */}
                                {selectedSet && (
                                    <div className={styles.formGroup}>
                                        <label>Select Card</label>
                                        {loading && cards.length === 0 ? <p>Loading cards...</p> : (
                                            <select
                                                className={styles.modalInput}
                                                onChange={(e) => {
                                                    const card = cards.find(c => c.id === e.target.value);
                                                    handleCardSelect(card);
                                                }}
                                                value={selectedCard ? selectedCard.id : ''}
                                                disabled={!selectedSet}
                                            >
                                                <option value="">-- Choose a Card --</option>
                                                {cards.map(card => (
                                                    <option key={card.id} value={card.id}>
                                                        #{card.number} - {card.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Step 3: Details (If Card selected OR Edit Mode) */}
                        {(selectedCard || isEditMode) && (
                            <>
                                {!isEditMode && <hr style={{ borderColor: '#333', margin: '20px 0' }} />}

                                <div className={styles.detailsContainer}>
                                    <div className={styles.selectedCardPreview}>
                                        <div style={{ position: 'relative', width: '240px', height: '336px', margin: '0 auto' }}>
                                            <SmartImage
                                                src={selectedCard.image}
                                                alt={selectedCard.name}
                                                fill
                                                style={{ objectFit: 'contain' }}
                                            />
                                        </div>
                                        <h4>{selectedCard.name}</h4>
                                        <p>{selectedSet ? selectedSet.name : ''} {selectedCard.number ? `#${selectedCard.number}` : ''}</p>
                                    </div>

                                    <div className={styles.formPanel}>
                                        <div className={styles.formGroup}>
                                            <label>Condition</label>
                                            <div className={styles.conditionToggle}>
                                                {CONDITIONS.map(cond => (
                                                    <button
                                                        key={cond}
                                                        className={styles.condBtn}
                                                        style={{
                                                            background: listingDetails.condition === cond ? '#27272a' : 'transparent',
                                                            color: listingDetails.condition === cond ? '#fff' : '#71717a',
                                                            boxShadow: listingDetails.condition === cond ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                                                            border: listingDetails.condition === cond ? '1px solid #3f3f46' : '1px solid transparent'
                                                        }}
                                                        onClick={() => setListingDetails({ ...listingDetails, condition: cond })}
                                                    >
                                                        {cond}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Selling Price (HKD)</label>
                                            <input
                                                type="number"
                                                value={listingDetails.price}
                                                onChange={(e) => setListingDetails({ ...listingDetails, price: e.target.value })}
                                                className={styles.modalInput}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Stock Quantity</label>
                                            <input
                                                type="number"
                                                value={listingDetails.stock}
                                                onChange={(e) => setListingDetails({ ...listingDetails, stock: e.target.value })}
                                                className={styles.modalInput}
                                            />
                                        </div>

                                        <button onClick={handleSubmit} className={styles.submitBtn} disabled={loading}>
                                            {loading ? 'Saving...' : (isEditMode ? 'Update Listing' : 'Add Listing')}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
