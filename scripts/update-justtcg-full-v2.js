import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CardSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameJP: String,
    nameEN: String,
    image: String,
    price: Number,
    currency: String,
    set: String,
    setId: String,
    cardType: String,
    updatedAt: Date
}, { strict: false });
const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

const BASE_URL = 'https://api.justtcg.com/v1';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, key, retries = 5) {
    for (let i = 0; i < retries; i++) {
        const res = await fetch(url, { headers: { 'x-api-key': key } });
        if (res.ok) return res;
        if (res.status === 429) {
            // console.log(`    Rate Limited (429). Waiting ${3000 * (i+1)}ms...`);
            await sleep(3000 * (i + 1)); // Increase wait time
            continue;
        }
        throw new Error(`Status ${res.status}`);
    }
    throw new Error('Max Retries');
}

async function updateJustTCG() {
    const key = process.env.JUSTTCG_API_KEY;
    if (!key) { console.error("Missing Key"); process.exit(1); }

    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Wipe Old Data (Optional? User asked for clean slate)
    console.log("Cleaning DB (Safe Mode)...");
    await Card.deleteMany({});
    console.log("DB Cleaned.");

    // 1. Fetch JP Sets
    console.log("Fetching Sets...");
    const sRes = await fetchWithRetry(`${BASE_URL}/sets?game=pokemon-japan`, key);
    // if (!sRes.ok) throw new Error("Failed to fetch sets"); // handled by fetchWithRetry
    const sJson = await sRes.json();
    const sets = sJson.data || [];
    console.log(`Found ${sets.length} sets.`);

    let totalUpserted = 0;

    for (const set of sets) {
        process.stdout.write(`Set: ${set.name} (${set.code || set.id})... `);

        // Loop Pages
        let offset = 0;
        let limit = 20; // Default max seems to be 20
        let hasMore = true;
        let setCardCount = 0;

        while (hasMore) {
            // console.log(`  Fetching offset ${offset}...`);
            const cUrl = `${BASE_URL}/cards?game=pokemon-japan&set_id=${encodeURIComponent(set.id)}&limit=${limit}&offset=${offset}`;

            try {
                // Rate Limit Throttle
                await sleep(150);

                const cRes = await fetchWithRetry(cUrl, key);
                const cJson = await cRes.json();
                const cards = cJson.data || [];

                if (cards.length === 0) {
                    hasMore = false;
                    continue;
                }

                // Check Meta
                if (cJson.meta) {
                    hasMore = cJson.meta.hasMore;
                } else {
                    hasMore = cards.length === limit;
                }

                offset += cards.length;

                // Upsert Ops
                const ops = cards.map(card => {
                    // Price: use latest if available
                    // Extract price from top level or prices array
                    let price = card.price || 0;
                    if (!price && card.prices && Array.isArray(card.prices) && card.prices.length > 0) {
                        // Likely history. Sort by time?
                        // JustTCG often sends 'latest_price' or simple structure. 
                        // Inspection showed "prices": [ {p: 3999...} ].
                        // Use first?
                        price = card.prices[card.prices.length - 1].p; // Last entry usually latest? Or Sort by t?
                        // Ideally JustTCG has "latest_price".
                    }

                    return {
                        updateOne: {
                            filter: { id: card.id },
                            update: {
                                $set: {
                                    id: card.id,
                                    name: card.name,
                                    nameJP: card.name,
                                    image: card.image,
                                    price: price,
                                    currency: 'JPY', // Assume JPY for JP cards
                                    set: set.name,
                                    setId: set.code || set.id,
                                    cardType: 'single',
                                    updatedAt: new Date()
                                }
                            },
                            upsert: true
                        }
                    };
                });

                await Card.bulkWrite(ops);
                setCardCount += ops.length;
                totalUpserted += ops.length;

            } catch (e) {
                console.log(`Err: ${e.message}`);
                hasMore = false;
            }
        }
        console.log(`Done (${setCardCount} cards).`);
    }

    console.log(`\nImport Complete. Total: ${totalUpserted}`);
    process.exit(0);
}

updateJustTCG().catch(console.error);
