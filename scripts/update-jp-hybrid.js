import { getJPCardsBySet } from '../lib/tcgdex.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Define Card Schema locally
const CardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameJP: String,
    image: String,
    price: Number,
    currency: String,
    set: String,
    setId: String, // Added setId
    cardType: String,
    updatedAt: Date
}, { strict: false });
const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

async function getAllJPSets() {
    try {
        const res = await fetch('https://api.tcgdex.net/v2/ja/sets');
        if (!res.ok) throw new Error('Failed to fetch sets');
        const sets = await res.json();
        // Return unique IDs
        const ids = [...new Set(sets.map(s => s.id))];
        return ids;
    } catch (e) {
        console.error("Error fetching set list:", e);
        return [];
    }
}

async function updateHybrid() {
    console.log("Connecting (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Loading Legacy Price Backup...");
    const backupPath = 'backups/legacy_prices.json';
    if (!fs.existsSync(backupPath)) {
        console.error("No backup found! Run backup-prices.js first.");
        process.exit(1);
    }
    const legacy = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Build Map: "SetCode-Num" -> { price, id }
    const priceMap = new Map();
    let mappedCount = 0;

    legacy.forEach(item => {
        // Regex: Matches [SetCode Number] or [SetCode Number/Total]
        const match = item.name.match(/\[([a-zA-Z0-9]+)\s+([0-9]+)(\/[0-9]+)?\]/);

        if (match) {
            const setCode = match[1].toLowerCase();
            const num = parseInt(match[2]);
            const key = `${setCode}-${num}`;
            if (!priceMap.has(key)) {
                priceMap.set(key, { price: item.price, legacyId: item.id });
                mappedCount++;
            }
        }
    });
    console.log(`Mapped ${mappedCount}/${legacy.length} legacy items for migration.`);

    let totalUpserted = 0;
    let totalMigrated = 0;
    const legacyIdsToDelete = [];

    // Fetch ALL sets
    console.log("Fetching Full Set List from TCGdex...");
    const allSets = await getAllJPSets();
    console.log(`Found ${allSets.length} sets to process.`);

    for (const setId of allSets) {
        console.log(`\nProcessing TCGdex Set: ${setId}...`);
        try {
            const cards = await getJPCardsBySet(setId);

            if (cards.length === 0) {
                console.log("  No cards found (or error).");
                continue;
            }
            console.log(`  Found ${cards.length} cards.`);

            const cardOps = [];

            for (const card of cards) {
                // TCGdex LocalID might be "001" or "1". Parse Int.
                let num = 0;
                // Try parsing localId. If string contains letters (e.g. '001a'), parser stops?
                // TCGdex localId usually numeric for JP main sets.
                // If not numeric, no match.
                try { num = parseInt(card.localId); } catch (e) { }

                const key = `${setId.toLowerCase()}-${num}`; // "sv4a-1"

                const match = priceMap.get(key);
                let price = 0;

                if (match) {
                    price = match.price;
                    legacyIdsToDelete.push(match.legacyId); // Mark for deletion
                }

                // Prepare Bulk Op
                cardOps.push({
                    updateOne: {
                        filter: { id: `jp-${setId}-${card.localId}` },
                        update: {
                            $set: {
                                id: `jp-${setId}-${card.localId}`,
                                name: card.name,
                                nameJP: card.name,
                                image: card.image,
                                price: price, // Legacy Price or 0
                                currency: 'JPY',
                                set: card.set,
                                setId: setId, // Added setId
                                cardType: 'single',
                                updatedAt: new Date()
                            }
                        },
                        upsert: true
                    }
                });

                if (price > 0) totalMigrated++;
            }

            if (cardOps.length > 0) {
                await Card.bulkWrite(cardOps);
                totalUpserted += cardOps.length;
                console.log(`  -> Upserted ${cardOps.length}. Migrated Prices: ${totalMigrated}`);
            }
        } catch (e) {
            console.error(`  Error processing set ${setId}:`, e.message);
        }
    }

    console.log(`\nNew Data Ingested. Total Upserted: ${totalUpserted}. Total Migrated Prices: ${totalMigrated}`);

    // Delete Migrated Legacy Cards
    if (legacyIdsToDelete.length > 0) {
        // Remove duplicates from list
        const uniqueIds = [...new Set(legacyIdsToDelete)];
        console.log(`Deleting ${uniqueIds.length} migrated legacy cards...`);
        const res = await Card.deleteMany({ id: { $in: uniqueIds } });
        console.log(`  -> Deleted ${res.deletedCount}`);
    } else {
        console.log("No legacy cards marked for deletion.");
    }

    console.log("Hybrid Update Complete.");
    process.exit(0);
}

updateHybrid().catch(console.error);
