import { searchSnkrdunk } from '../lib/snkrdunk.js';
import { upsertCards, getAllCards } from '../lib/db.js';

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Seed search terms - common Pokemon names, trainers, and card types
const POKEMON_SEEDS = [
    // Popular Pokemon
    'Pikachu', 'Charizard', 'Mew', 'Mewtwo', 'Eevee', 'Umbreon', 'Espeon',
    'Gengar', 'Lugia', 'Rayquaza', 'Giratina', 'Arceus', 'Dialga', 'Palkia',
    'Reshiram', 'Zekrom', 'Kyurem', 'Xerneas', 'Yveltal', 'Zacian', 'Zamazenta',
    'Calyrex', 'Miraidon', 'Koraidon', 'Gardevoir', 'Mimikyu', 'Lucario',
    'Greninja', 'Sylveon', 'Vaporeon', 'Jolteon', 'Flareon', 'Glaceon', 'Leafeon',
    'Dragonite', 'Tyranitar', 'Salamence', 'Metagross', 'Garchomp', 'Hydreigon',
    'Blastoise', 'Venusaur', 'Gyarados', 'Snorlax', 'Lapras', 'Alakazam',
    'Machamp', 'Arcanine', 'Ninetales', 'Rapidash', 'Magikarp', 'Ditto',
    'Articuno', 'Zapdos', 'Moltres', 'Celebi', 'Suicune', 'Entei', 'Raikou',
    'Latias', 'Latios', 'Groudon', 'Kyogre', 'Deoxys', 'Jirachi',
    'Darkrai', 'Shaymin', 'Manaphy', 'Cresselia', 'Heatran', 'Regigigas',
    'Meloetta', 'Genesect', 'Keldeo', 'Victini', 'Reshiram', 'Zekrom',

    // Japanese trainer names (popular)
    'ナンジャモ', 'リーリエ', 'マリィ', 'ルザミーネ', 'カトレア', 'シロナ',
    'Iono', 'Lillie', 'Marnie', 'Cynthia', 'Serena', 'Professor',

    // Card types/rarities
    'SAR', 'SR', 'UR', 'AR', 'CHR', 'CSR', 'HR', 'SSR',
    'VMAX', 'VSTAR', 'ex', 'GX', 'EX', 'V', 'MEGA',

    // Sets/expansions (partial names)
    'VSTAR Universe', 'Shiny Treasure', 'Pokemon 151', 'Obsidian Flames',
    'Paldea Evolved', 'Scarlet & Violet', 'Crown Zenith', 'Silver Tempest',
    '25th Anniversary', 'Celebrations', 'Evolving Skies', 'Fusion Strike',
    'Brilliant Stars', 'Astral Radiance', 'Pokemon GO', 'Lost Origin'
];

async function bulkScrape() {
    console.log("=".repeat(60));
    console.log("SNKRDUNK Bulk Scraper");
    console.log("=".repeat(60));

    const startCount = getAllCards().length;
    console.log(`Starting card count: ${startCount}`);
    console.log(`Seed terms to search: ${POKEMON_SEEDS.length}`);
    console.log("=".repeat(60));

    let totalNewCards = 0;
    let searchedCount = 0;

    for (const term of POKEMON_SEEDS) {
        searchedCount++;
        console.log(`\n[${searchedCount}/${POKEMON_SEEDS.length}] Searching: "${term}"...`);

        try {
            const results = await searchSnkrdunk(term);

            if (results.length > 0) {
                const beforeCount = getAllCards().length;
                upsertCards(results);
                const afterCount = getAllCards().length;
                const newCards = afterCount - beforeCount;
                totalNewCards += newCards;

                console.log(`  → Found ${results.length} results, ${newCards} new cards added`);
            } else {
                console.log(`  → No results`);
            }

            // Rate limiting - wait 5 seconds between searches
            if (searchedCount < POKEMON_SEEDS.length) {
                console.log(`  → Waiting 5 seconds before next search...`);
                await delay(5000);
            }

        } catch (e) {
            console.error(`  → Error: ${e.message}`);
        }
    }

    const finalCount = getAllCards().length;

    console.log("\n" + "=".repeat(60));
    console.log("BULK SCRAPE COMPLETE");
    console.log("=".repeat(60));
    console.log(`Starting count: ${startCount}`);
    console.log(`Final count: ${finalCount}`);
    console.log(`New cards added: ${finalCount - startCount}`);
    console.log("=".repeat(60));
}

bulkScrape();
