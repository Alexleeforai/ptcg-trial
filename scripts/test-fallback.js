import { getSnkrdunkCard } from '../lib/snkrdunk.js';

async function test() {
    console.log("Testing getSnkrdunkCard with ID 331667...");
    try {
        const card = await getSnkrdunkCard('331667');
        console.log("Result:", JSON.stringify(card, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
