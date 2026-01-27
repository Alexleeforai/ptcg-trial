import { searchPokemonTCG, getAllSets } from '../lib/pokemontcg.js';
import { upsertCards } from '../lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Common search terms for Pokemon cards
const SEARCH_TERMS = [
    // Popular Pokemon
    'Pikachu', 'Charizard', 'Mew', 'Mewtwo', 'Eevee', 'Umbreon',
    'Gengar', 'Lugia', 'Rayquaza', 'Giratina', 'Arceus',

    // Popular trainers (English names)
    'Lillie', 'Marnie', 'Cynthia', 'Professor', 'Iono',
];

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromTCGAPI() {
    console.log("=".repeat(60));
    console.log("Pokemon TCG API Fetcher");
    console.log("=".repeat(60));

    let totalCards = 0;

    // Option 1: Search by terms
    console.log("\n[1/2] Fetching cards by search terms...\n");

    for (let i = 0; i < SEARCH_TERMS.length; i++) {
        const term = SEARCH_TERMS[i];
        console.log(`[${i + 1}/${SEARCH_TERMS.length}] Searching: "${term}"...`);

        try {
            const cards = await searchPokemonTCG(term);

            if (cards.length > 0) {
                await upsertCards(cards);
                totalCards += cards.length;
                console.log(`  → Found ${cards.length} cards`);
            } else {
                console.log(`  → No results`);
            }

            // Rate limiting - wait 1 second between searches
            if (i < SEARCH_TERMS.length - 1) {
                await delay(1000);
            }

        } catch (e) {
            console.error(`  → Error: ${e.message}`);
        }
    }

    // Option 2: Fetch recent sets (commented out for now to avoid overwhelming DB)
    // Uncomment this to fetch entire sets
    /*
    console.log("\n[2/2] Fetching recent sets...\n");
    
    try {
        const sets = await getAllSets();
        const recentSets = sets.slice(0, 3); // Get 3 most recent sets
        
        for (const set of recentSets) {
            console.log(`Fetching set: ${set.name} (${set.id})...`);
            const cards = await getCardsBySet(set.id);
            
            if (cards.length > 0) {
                await upsertCards(cards);
                totalCards += cards.length;
                console.log(`  → Added ${cards.length} cards`);
            }
            
            await delay(2000); // Wait 2 seconds between sets
        }
    } catch (e) {
        console.error("Error fetching sets:", e);
    }
    */

    console.log("\n" + "=".repeat(60));
    console.log("FETCH COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total cards processed: ${totalCards}`);
    console.log("=".repeat(60));
}

fetchFromTCGAPI().then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
}).catch(err => {
    console.error("\n✗ Script failed:", err);
    process.exit(1);
});
