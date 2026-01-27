import TCGdex from '@tcgdex/sdk';

async function checkTCGdexEN() {
    console.log("Checking TCGdex (EN) for set 'sv4a'...");

    // Init in English
    const tcgdex = new TCGdex('en');

    // Fetch Set 'sv4a'
    const cards = await tcgdex.fetch('sets', 'sv4a');
    // Wait, fetch('sets', id) returns set details + cards? 
    // My previous code used: tcgdex.fetch('series', 'sv')... no.
    // getJPCardsBySet used: tcgdex.fetch('sets', setId) -> resolve -> output.cards

    // Let's try to fetch the set and see cards[0].name
    try {
        const set = await tcgdex.fetch('sets', 'sv4a');
        if (!set || !set.cards) {
            console.log("Set not found or no cards.");
            return;
        }

        console.log(`Found ${set.cards.length} cards.`);
        const first = set.cards[0];
        console.log(`Sample Card [0]: ${first.name} (ID: ${first.localId})`);

    } catch (e) {
        console.error(e);
    }
}

checkTCGdexEN();
