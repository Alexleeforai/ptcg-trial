'use server';

import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { revalidatePath } from 'next/cache';

// Helper to ensure auth
async function getMerchantUser() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return userId;
}

export async function getMerchantListings() {
    const userId = await getMerchantUser();
    await connectToDatabase();

    // Find cards where this merchant has a listing
    const cards = await Card.find({
        "merchantListings.merchantId": userId
    }).lean();

    // Flatten to just the listing info enriched with card details
    const listings = cards.map(c => {
        const listing = c.merchantListings.find(l => l.merchantId === userId);
        return {
            cardId: c.id,
            cardName: c.name,
            cardImage: c.image,
            cardSet: c.set,
            cardPrice: c.price, // Market price
            ...listing // price, stock, updatedAt
        };
    });

    return listings;
}

export async function addListing(cardId, price, stock) {
    const userId = await getMerchantUser();
    await connectToDatabase();

    // Check if listing already exists
    const existing = await Card.findOne({
        id: cardId,
        "merchantListings.merchantId": userId
    });

    if (existing) {
        // Update existing
        await Card.updateOne(
            { id: cardId, "merchantListings.merchantId": userId },
            {
                $set: {
                    "merchantListings.$.price": Number(price),
                    "merchantListings.$.stock": Number(stock),
                    "merchantListings.$.updatedAt": new Date()
                }
            }
        );
    } else {
        // Add new
        await Card.updateOne(
            { id: cardId },
            {
                $push: {
                    merchantListings: {
                        merchantId: userId,
                        merchantName: "Merchant", // TOOD: Get real name from Clerk?
                        price: Number(price),
                        stock: Number(stock),
                        updatedAt: new Date()
                    }
                }
            }
        );
    }

    revalidatePath('/merchant');
    return { success: true };
}

export async function removeListing(cardId) {
    const userId = await getMerchantUser();
    await connectToDatabase();

    await Card.updateOne(
        { id: cardId },
        {
            $pull: {
                merchantListings: { merchantId: userId }
            }
        }
    );

    revalidatePath('/merchant');
    return { success: true };
}

// Search for adding new cards (wrapper around existing search but authenticated context if needed)
export async function searchCardsForMerchant(query) {
    // Just use the public search logic but exposing it as server action for the modal
    // Importing findCards from lib/db requires it to be async now, which matches
    const { findCards } = await import('@/lib/db');
    return await findCards(query);
}
