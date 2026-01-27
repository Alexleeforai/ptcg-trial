import { getJPCardsBySet } from '../lib/tcgdex.js';
import { fetchJPPrices } from '../lib/justtcg.js';
import { upsertCards } from '../lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Popular JP Sets to fetch (expandable)
const JP_SETS = [
    'sv4a', // Shiny Treasure
    'sv3',  // Ruler of the Black Flame
    'sv2a', // Pokemon 151
    's8a'   // 25th Anniversary
];

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function updateJPCards() {
    console.log("=".repeat(60));
    console.log("JP Card Updater (Hybrid: TCGdex + JustTCG)");
    console.log("=".repeat(60));

    let totalCards = 0;

    for (const setId of JP_SETS) {
        console.log(`\nFetching Set: ${setId}...`);

        try {
            // 1. Fetch Backbone Data from TCGdex
            const cards = await getJPCardsBySet(setId);
            console.log(`  → Found ${cards.length} cards in set`);

            if (cards.length === 0) continue;

            // 2. Enhance with Prices from JustTCG
            const cardData = [];

            // Process in chunks to avoid rate limits
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                process.stdout.write(`  Processing ${i + 1}/${cards.length}: ${card.name}\r`);

                // Fetch Price
                const price = await fetchJPPrices(card.name, setId);

                cardData.push({
                    id: `jp-${card.id}`, // e.g. jp-sv4a-001
                    name: card.name,
                    nameJP: card.name, // TCGdex usually gives JP name for JP sets
                    image: card.image,
                    price: price || 0, // 0 if not found
                    currency: 'JPY',
                    set: card.set,
                    releaseDate: '', // TCGdex might not give date in list
                    cardType: 'single',
                    updatedAt: new Date()
                });

                // Mild delay between price fetches
                await delay(100);
            }
            console.log(""); // Newline after progress

            // 3. Upsert to DB
            if (cardData.length > 0) {
                await upsertCards(cardData);
                totalCards += cardData.length;
                console.log(`  → Upserted ${cardData.length} cards to DB`);
            }

        } catch (e) {
            console.error(`  → Error processing set ${setId}: ${e.message}`);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("JP UPDATE COMPLETE");
    console.log(`Total cards processed: ${totalCards}`);
    console.log("=".repeat(60));
}

updateJPCards().then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
}).catch(err => {
    console.error("\n✗ Script failed:", err);
    process.exit(1);
});
