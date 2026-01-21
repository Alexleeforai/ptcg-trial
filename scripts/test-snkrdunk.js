
import { searchSnkrdunk } from '../lib/snkrdunk.js';

async function test() {
    console.log("Testing SNKRDUNK Scraper...");
    try {
        const results = await searchSnkrdunk("Pikachu");
        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First Result:", JSON.stringify(results[0], null, 2));
        } else {
            console.log("No results found.");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
