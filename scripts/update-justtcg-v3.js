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

async function fetchWithRetry(url, key, retries = 10) {
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

        try {
            const res = await fetch(url, {
                headers: { 'x-api-key': key },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) return res;
            if (res.status === 429) {
                console.log(`    [429] Waiting ${5000 * (i + 1)}ms...`);
                await sleep(5000 * (i + 1));
                continue;
            }
            // 502/500/503 -> Retry
            if (res.status >= 500) {
                console.log(`    [${res.status}] Retry...`);
                await sleep(3000);
                continue;
            }
            throw new Error(`Status ${res.status}`);
        } catch (e) {
            clearTimeout(timeoutId);
            if (e.name === 'AbortError') throw new Error('Timeout');
            // If network error, retry
            if (i === retries - 1) throw e;
            await sleep(2000);
        }
    }
    throw new Error('Max Retries');
}

async function updateJustTCG() {
    const key = process.env.JUSTTCG_API_KEY;
    if (!key) { console.error("Missing Key"); process.exit(1); }

    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Cleaning DB...");
    await Card.deleteMany({});

    console.log("Fetching Sets...");
    try {
        const sRes = await fetchWithRetry(`${BASE_URL}/sets?game=pokemon-japan`, key);
        const sJson = await sRes.json();
        let sets = sJson.data || [];
        console.log(`Found ${sets.length} sets. Reversing order...`);

        // Reverse to start with Z (likely newer sets or at least not "10th Movie")
        sets.reverse();

        // Or Sort by Code?
        // sets.sort((a,b) => (b.code || "").localeCompare(a.code || ""));

        let totalUpserted = 0;

        for (const set of sets) {
            process.stdout.write(`Processing ${set.name} (${set.id})... `);

            let offset = 0;
            let limit = 20;
            let hasMore = true;
            let upsertedCount = 0;
            let errors = 0;

            while (hasMore) {
                const cUrl = `${BASE_URL}/cards?game=pokemon-japan&set_id=${encodeURIComponent(set.id)}&offset=${offset}&limit=${limit}`;

                try {
                    await sleep(1000); // Conservative delay

                    const cRes = await fetchWithRetry(cUrl, key);
                    const cJson = await cRes.json();

                    const cards = cJson.data || [];
                    if (cards.length > 0 && totalUpserted === 0) {
                        console.log("SAMPLE RAW CARD:", JSON.stringify(cards[0], null, 2));
                    }

                    if (cards.length === 0) {
                        hasMore = false;
                        continue;
                    }

                    // Check Meta
                    if (cJson.meta) {
                        hasMore = cJson.meta.hasMore;
                    } else {
                        // fallback
                        hasMore = cards.length === limit;
                    }

                    offset += cards.length;

                    const ops = cards.map(card => {
                        let price = card.price || 0;
                        if (!price && card.prices && card.prices.length > 0) {
                            // Try to find a valid price
                            price = card.prices[card.prices.length - 1].p || 0;
                        }

                        return {
                            updateOne: {
                                filter: { id: card.id },
                                update: {
                                    $set: {
                                        id: card.id,
                                        name: card.name,
                                        nameJP: card.name,
                                        image: card.image_url || card.image,
                                        price: price,
                                        currency: 'JPY',
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

                    if (ops.length > 0) {
                        await Card.bulkWrite(ops);
                        upsertedCount += ops.length;
                        totalUpserted += ops.length;
                    }

                } catch (e) {
                    console.log(` Err: ${e.message}`);
                    errors++;
                    if (errors > 3) {
                        // process.stdout.write(" Skip (Too many errors).");
                        hasMore = false; // Skip this set
                    }
                }
            }
            console.log(`Done (${upsertedCount}).`);
        }

        console.log(`\nImport Complete. Total: ${totalUpserted}`);
    } catch (err) {
        console.error("Global Error:", err);
    }
    process.exit(0);
}

updateJustTCG().catch(console.error);
