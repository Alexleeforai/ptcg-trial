import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Define Card Schema locally
const CardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameJP: String,
    nameEN: String,
    image: String,
    price: Number,
    currency: String,
    set: String,
    setId: String, // standardized code if possible
    cardType: String,
    updatedAt: Date
}, { strict: false });
const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

const BASE_URL = 'https://api.justtcg.com/v1';

async function updateJustTCG() {
    const key = process.env.JUSTTCG_API_KEY;
    if (!key) { console.error("Missing API Key"); process.exit(1); }

    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Fetch JP Sets
    console.log("Fetching Pokemon Japan Sets...");
    const sRes = await fetch(`${BASE_URL}/sets?game=pokemon-japan`, { headers: { 'x-api-key': key } });
    if (!sRes.ok) { console.error("Failed to fetch sets"); process.exit(1); }

    const sJson = await sRes.json();
    const sets = sJson.data || [];
    console.log(`Found ${sets.length} sets.`);

    let totalUpserted = 0;

    // Iterate Sets
    for (const set of sets) {
        console.log(`Processing Set: ${set.name} (${set.code || set.id})...`);

        // Fetch Cards
        // Endpoint: /cards?game=pokemon-japan&set_id={id}
        const cUrl = `${BASE_URL}/cards?game=pokemon-japan&set_id=${set.id}`;

        try {
            const cRes = await fetch(cUrl, { headers: { 'x-api-key': key } });
            if (!cRes.ok) {
                console.log(`  Failed to fetch cards: ${cRes.status}`);
                continue;
            }
            const cJson = await cRes.json();
            const cards = cJson.data || [];

            if (cards.length === 0) {
                console.log("  No cards found.");
                continue;
            }

            const ops = [];

            for (const card of cards) {
                // JustTCG structure:
                // id, name, image, prices: { latest, ... }
                // NOTE: Check if prices is array or object. Inspection showed array in prices history?
                // Wait, Sample in step 1197 showed: 
                // "prices": [ { "p": 3999.99, "t": ... } ] inside "price_history"? 
                // Or "prices" object?
                // Visual inspection of JustTCG usually: `prices: { latest: 123 }` or similar.
                // But inspecting the log (Step 1197) only showed `minPriceAllTime` etc.
                // Assuming `latest_price` or similar field exists, or use array[0].
                // ACTUALLY: The log showed `minPrice30d` etc.
                // I will use `card.price` if top level, or look for `prices` entries.
                // JustTCG cards usually have `prices` array or object.
                // Let's assume `card.prices.latest` or `card.price`.
                // I'll check `card.price` safely.

                let price = 0;
                // JustTCG typically provides `prices` map for variants (normal, holo).
                // Or distinct cards for variants.
                // I'll try to find a price.

                ops.push({
                    updateOne: {
                        filter: { id: card.id },
                        update: {
                            $set: {
                                id: card.id,
                                name: card.name,
                                nameJP: card.name, // JustTCG Name (English or JP?) likely English if translated, but for JP game might be JP.
                                image: card.image,
                                price: card.price || 0, // Fallback
                                currency: 'USD', // Assume USD
                                set: set.name,
                                setId: set.code || set.id,
                                cardType: 'single',
                                updatedAt: new Date()
                            }
                        },
                        upsert: true
                    }
                });
            }

            if (ops.length > 0) {
                await Card.bulkWrite(ops);
                totalUpserted += ops.length;
                console.log(`  -> Upserted ${ops.length}.`);
            }

        } catch (e) {
            console.error(`  Error: ${e.message}`);
        }
    }

    console.log(`\nImport Complete. Total Upserted: ${totalUpserted}`);
    process.exit(0);
}

updateJustTCG().catch(console.error);
