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

    // 2. Identify unique names to refresh
    const uniqueNames = [...new Set(allCards.map(c => c.name))];
    console.log(`Found ${uniqueNames.length} unique card names to query.`);

    let updatedCount = 0;
    let queryCount = 0;

    for (const name of uniqueNames) {
        if (!name) continue;

        queryCount++;
        console.log(`[${queryCount}/${uniqueNames.length}] Querying: "${name}"...`);

        try {
            // Re-scrape by name (gets a list of cards)
            const results = await searchSnkrdunk(name);

            if (results.length === 0) {
                console.log(`   No results found for "${name}"`);
            }

            // Match results against DB
            let matchCount = 0;
            const updates = [];

            for (const result of results) {
                // Check if this result ID exists in our DB
                const existingCard = allCards.find(c => c.id === result.id);

                if (existingCard) {
                    // It's a match! Update it.
                    // preserving properties that might not be in result (like releaseDate if we scraped it separately, though result usually has less info)
                    // Actually search result has price, name, image.
                    updates.push(result);
                    matchCount++;
                }
            }

            if (updates.length > 0) {
                upsertCards(updates);
                updatedCount += updates.length;
                console.log(`   ✓ Updated ${updates.length} cards matching "${name}"`);
            } else {
                console.log(`   No matching DB cards updated for "${name}"`);
            }

            // Wait 5 seconds between requests to be polite and avoid rate limits
            await delay(5000);

        } catch (e) {
            console.error(`Failed to update query "${name}":`, e);
        }
    }

    console.log(`Job Complete. Updated ${updatedCount} cards in total.`);
}

updateAllPrices();
