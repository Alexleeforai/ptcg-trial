'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const CollectionContext = createContext({
    collectionIds: new Set(),
    addToCollection: async () => { },
    removeFromCollection: async () => { },
    isCollecting: false
});

export function CollectionProvider({ children }) {
    const { isSignedIn } = useAuth();
    const [collectionIds, setCollectionIds] = useState(new Set());
    const [isCollecting, setIsCollecting] = useState(true); // Loading initially

    // Fetch IDs on mount/login
    useEffect(() => {
        if (!isSignedIn) {
            setCollectionIds(new Set());
            setIsCollecting(false);
            return;
        }

        const fetchIds = async () => {
            try {
                const res = await fetch('/api/collection/ids');
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.ids)) {
                        setCollectionIds(new Set(data.ids));
                    } else {
                        setCollectionIds(new Set());
                    }
                }
            } catch (e) {
                console.error("Failed to sync collection", e);
            } finally {
                setIsCollecting(false);
            }
        };

        fetchIds();
    }, [isSignedIn]);

    const addToCollection = async (cardId) => {
        // Optimistic update
        const nextIds = new Set(collectionIds);
        nextIds.add(cardId);
        setCollectionIds(nextIds);

        try {
            await fetch('/api/collection/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId })
            });
        } catch (e) {
            console.error("Add failed", e);
            // Revert
            const revertIds = new Set(collectionIds);
            revertIds.delete(cardId);
            setCollectionIds(revertIds);
        }
    };

    const removeFromCollection = async (cardId) => {
        // Optimistic update
        const nextIds = new Set(collectionIds);
        nextIds.delete(cardId);
        setCollectionIds(nextIds);

        try {
            await fetch('/api/collection/remove', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId })
            });
        } catch (e) {
            console.error("Remove failed", e);
            // Revert
            const revertIds = new Set(collectionIds);
            revertIds.add(cardId);
            setCollectionIds(revertIds);
        }
    };

    return (
        <CollectionContext.Provider value={{
            collectionIds,
            addToCollection,
            removeFromCollection,
            isCollecting
        }}>
            {children}
        </CollectionContext.Provider>
    );
}

export const useCollection = () => useContext(CollectionContext);
