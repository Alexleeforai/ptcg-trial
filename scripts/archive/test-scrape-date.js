import { getSnkrdunkCard } from '../lib/snkrdunk.js';

(async () => {
    console.log("Testing scraper for Release Date...");
    // ID used earlier: 722239
    const card = await getSnkrdunkCard('722239');

    if (card) {
        console.log("Scrape Success!");
        console.log("Name:", card.name);
        console.log("Release Date:", card.releaseDate);
        if (card.releaseDate) {
            console.log("Test PASSED: Release date found.");
        } else {
            console.error("Test FAILED: Release date is null/undefined.");
        }
    } else {
        console.error("Scrape returned null.");
    }
})();
