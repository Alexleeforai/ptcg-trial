'use client';

import { useState } from 'react';
import AddListingModal from '@/components/merchant/AddListingModal';

export default function InlineAddListingTrigger({ card }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500'
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                商戶報價
            </button>

            {isModalOpen && (
                <AddListingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={{
                        id: card.id,
                        name: card.name,
                        number: card.number,
                        image: card.image,
                        set: card.set
                    }}
                    onListingAdded={() => {
                        window.location.reload(); // Quick refresh to show new listing
                    }}
                />
            )}
        </>
    );
}
