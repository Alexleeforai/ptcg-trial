import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function estimate() {
    const key = process.env.JUSTTCG_API_KEY;
    const sRes = await fetch('https://api.justtcg.com/v1/sets?game=pokemon-japan', { headers: { 'x-api-key': key } });
    const json = await sRes.json();
    const sets = json.data || [];

    console.log(`Sets: ${sets.length}`);

    // Sum counts if available
    let total = 0;
    let setsWithCount = 0;
    // JustTCG set object structure from Step 1190/1176 logs:
    // { id, name, count, cards_count ... }

    sets.forEach(s => {
        if (s.cards_count) {
            total += s.cards_count;
            setsWithCount++;
        }
    });

    if (setsWithCount > 0) {
        console.log(`Total reported cards: ${total}`);
    } else {
        console.log("No card counts in set metadata. Estimating...");
        // Estimate 80 per set?
        console.log(`Estimate (80/set): ${sets.length * 80}`);
    }
}
estimate();
