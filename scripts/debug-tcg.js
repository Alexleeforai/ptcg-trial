const { getTCGPlayerPrices } = require('../lib/tcgplayer-server');

// Mocking the server action execution environment (Node)
// Since getTCGPlayerPrices is "use server", we might need to copy it or just run a similar puppeteer script.
// To be safe and quick, I'll create a standalone script that duplicates the logic but outputs to console.

const puppeteer = require('puppeteer');

async function debugScrape(query) {
    console.log(`Searching for: "${query}"`);
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const url = `https://www.tcgplayer.com/search/pokemon-japan/product?productLineName=pokemon-japan&q=${encodeURIComponent(query)}&view=grid&page=1`;
    console.log(`URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const results = await page.evaluate(() => {
        const items = document.querySelectorAll('.search-result, .product-card__container');
        return Array.from(items).map(el => {
            const titleEl = el.querySelector('.product-card__title');
            const priceEl = el.querySelector('.product-card__market-price--value');
            const setEl = el.querySelector('h4, .product-card__set-name');
            return {
                name: titleEl ? titleEl.innerText.trim() : 'No Title',
                price: priceEl ? priceEl.innerText.trim() : 'No Price',
                set: setEl ? setEl.innerText.trim() : 'No Set',
                link: el.closest('a') ? el.closest('a').href : ''
            };
        });
    });

    console.log("Results found:", results.length);
    results.forEach((r, i) => {
        console.log(`[${i}] ${r.name} | ${r.set} | ${r.price}`);
    });

    await browser.close();
}

(async () => {
    // Test case 1: Charizard from Ruler of the Black Flame (Japanese)
    // Card Number: 134/108
    await debugScrape("Charizard ex Ruler of the Black Flame");

    console.log("\n-----------------------------------\n");

    // Test case 2: Iono from Shiny Treasure ex
    // Card Number: 350/190
    await debugScrape("Iono Shiny Treasure ex");
})();
