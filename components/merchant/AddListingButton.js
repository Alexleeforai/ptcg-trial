'use client';

import { useState } from 'react';
import { searchCardsForMerchant, addListing } from '@/app/actions/merchant';

export default function AddListingButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: '10px 20px',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                + Add Listing
            </button>

            {isOpen && <AddListingModal onClose={() => setIsOpen(false)} />}
        </>
    );
}

function AddListingModal({ onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [form, setForm] = useState({ price: '', stock: '1' });
    const [submitting, setSubmitting] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data = await searchCardsForMerchant(query);
            setResults(data);
            setSelectedCard(null); // Reset selection
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCard) return;

        setSubmitting(true);
        try {
            await addListing(selectedCard.id, form.price, form.stock);
            onClose(); // Close modal on success
            // Ideally trigger refresh on parent
            window.location.reload();
        } catch (e) {
            alert('Failed to add listing');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Add New Listing</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                {!selectedCard ? (
                    <>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search card name (e.g. Charizard)..."
                                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: 'white' }}
                            />
                            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {results.map(card => (
                                <div
                                    key={card.id}
                                    onClick={() => setSelectedCard(card)}
                                    style={{
                                        display: 'flex', gap: '10px', padding: '10px', background: '#222', borderRadius: '6px', cursor: 'pointer',
                                        border: '1px solid transparent', transition: 'border 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = '#555'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <img src={card.image} alt={card.name} style={{ width: '50px', objectFit: 'contain' }} />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{card.name}</div>
                                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{card.set} • ¥{card.price?.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                            {results.length === 0 && !loading && <p style={{ color: '#555', textAlign: 'center' }}>No results</p>}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#222', borderRadius: '8px' }}>
                            <img src={selectedCard.image} alt={selectedCard.name} style={{ width: '60px' }} />
                            <div>
                                <div>{selectedCard.name}</div>
                                <div style={{ color: '#888' }}>{selectedCard.set}</div>
                                <button type="button" onClick={() => setSelectedCard(null)} style={{ color: '#3b82f6', background: 'transparent', border: 'none', padding: 0, marginTop: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Back to Search</button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Price (HKD)</label>
                            <input
                                type="number"
                                required
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: 'white' }}
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Stock</label>
                            <input
                                type="number"
                                required
                                value={form.stock}
                                onChange={e => setForm({ ...form, stock: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#222', color: 'white' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%', padding: '12px', background: '#fff', color: '#000',
                                border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? 'Adding...' : 'Confirm Listing'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
