import { getAllCards, upsertCards } from '../lib/db.js';
import { searchSnkrdunk } from '../lib/snkrdunk.js';

// Simple delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function updateAllPrices() {
    console.log("Starting Price Update Job...");

    // 1. Get all cards
    const allCards = getAllCards();
    console.log(`Found ${allCards.length} cards in DB.`);

    if (allCards.length === 0) {
        console.log("No cards to update.");
        return;
    }

    // 2. Identify unique search terms to refresh
    // Since we store individual cards, but scrape by "Search Query", 
    // we should ideally re-scrape the original queries. 
    // However, we don't store "Original Query". 
    // Strategy: Extract unique card names (simplest approximation) or re-search by name.

    // For now, let's just update using the card Name as the query.
    // To optimize, we can group similar ones, but doing 1-by-1 is safer for accuracy.

    // Limit to updating a subset or all? 
    // Let's do all, with delay.

    let updatedCount = 0;

    for (const card of allCards) {
        console.log(`Updating: ${card.name}...`);
        try {
            // Re-scrape specific card name
            const results = await searchSnkrdunk(card.name);

            // Find the specific matching card in results (by ID if possible, or name match)
            // SNKRDUNK IDs are stable (from URL).
            const match = results.find(r => r.id === card.id);

            if (match) {
                // Update this specific card
                upsertCards([match]);
                console.log(`✓ Updated ${card.name}: ¥${match.price}`);
                updatedCount++;
            } else {
                console.log(`? Could not find exact match for ${card.id} in search results. Results count: ${results.length}`);
                // Optional: If we found other valid cards, might as well adding them? 
                // Let's just focus on updating existing for now.
            }

            // Wait 5 seconds between requests to be polite
            await delay(5000);

        } catch (e) {
            console.error(`Failed to update ${card.name}:`, e);
        }
    }

    console.log(`Job Complete. Updated ${updatedCount}/${allCards.length} cards.`);
}

updateAllPrices();
