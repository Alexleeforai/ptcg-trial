'use client';

import { useState } from 'react';
import { removeListing, addListing } from '@/app/actions/merchant';

export default function MerchantListingsTable({ initialListings }) {
    const [listings, setListings] = useState(initialListings);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ price: '', stock: '' });

    // Handle Delete
    const handleDelete = async (cardId) => {
        if (!confirm('Are you sure you want to remove this listing?')) return;
        await removeListing(cardId);
        // Optimistic update handled by page refresh or we can update local state
        setListings(l => l.filter(i => i.cardId !== cardId));
    };

    // Handle Edit Start
    const startEdit = (listing) => {
        setEditingId(listing.cardId);
        setEditForm({ price: listing.price, stock: listing.stock });
    };

    // Handle Edit Save
    const saveEdit = async (cardId) => {
        await addListing(cardId, editForm.price, editForm.stock);
        setEditingId(null);
        // Ideally we re-fetch or basic update
        setListings(l => l.map(item =>
            item.cardId === cardId
                ? { ...item, price: editForm.price, stock: editForm.stock }
                : item
        ));
    };

    if (listings.length === 0) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', background: '#222', borderRadius: '8px', border: '1px dashed #444' }}>
                <p style={{ color: '#888' }}>No listings yet. Click "Add Listing" to start selling!</p>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '0.9rem' }}>
                        <th style={{ padding: '12px' }}>Card</th>
                        <th style={{ padding: '12px' }}>Set</th>
                        <th style={{ padding: '12px' }}>Market Price</th>
                        <th style={{ padding: '12px' }}>Your Price (HKD)</th>
                        <th style={{ padding: '12px' }}>Stock</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map(item => (
                        <tr key={item.cardId} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={item.cardImage} alt={item.cardName} style={{ width: '40px', height: 'auto', borderRadius: '4px' }} />
                                <span>{item.cardName}</span>
                            </td>
                            <td style={{ padding: '12px', color: '#888' }}>{item.cardSet}</td>
                            <td style={{ padding: '12px', color: '#888' }}>
                                ¥{item.cardPrice?.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px' }}>
                                {editingId === item.cardId ? (
                                    <input
                                        type="number"
                                        value={editForm.price}
                                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                        style={{ background: '#333', border: '1px solid #555', color: 'white', padding: '4px', width: '80px', borderRadius: '4px' }}
                                    />
                                ) : (
                                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>${item.price}</span>
                                )}
                            </td>
                            <td style={{ padding: '12px' }}>
                                {editingId === item.cardId ? (
                                    <input
                                        type="number"
                                        value={editForm.stock}
                                        onChange={e => setEditForm({ ...editForm, stock: e.target.value })}
                                        style={{ background: '#333', border: '1px solid #555', color: 'white', padding: '4px', width: '60px', borderRadius: '4px' }}
                                    />
                                ) : (
                                    <span>{item.stock}</span>
                                )}
                            </td>
                            <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {editingId === item.cardId ? (
                                        <>
                                            <button onClick={() => saveEdit(item.cardId)} style={{ padding: '4px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                                            <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(item)} style={{ padding: '4px 12px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => handleDelete(item.cardId)} style={{ padding: '4px 12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
