async function testTCGdexSets() {
    console.log("Fetching JP Sets from TCGdex...");
    const url = 'https://api.tcgdex.net/v2/ja/sets';

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(res.status);
            return;
        }

        const sets = await res.json();
        console.log(`Found ${sets.length} sets.`);

        // Print sample
        if (sets.length > 0) {
            console.log("Sample Set:", JSON.stringify(sets[0], null, 2));
        }

        // Sort by release date? They might not have date.
        // Usually recent sets are at the end or beginning?
        // Let's print first 5 and last 5 IDs
        // Check for 'sv' sets
        const svSets = sets.filter(s => s.id.toLowerCase().startsWith('sv'));
        console.log(`Found ${svSets.length} SV sets.`);
        if (svSets.length > 0) {
            console.log("Sample SV Set:", svSets[0].id, svSets[0].name);
            console.log("All SV IDs:", svSets.map(s => s.id));
        }

    } catch (e) {
        console.error(e);
    }
}

testTCGdexSets();
