'use server';

import puppeteer from 'puppeteer';

export async function getTCGPlayerPrices(query) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Construct URL with page=1 to be explicit
        const url = `https://www.tcgplayer.com/search/pokemon-japan/product?productLineName=pokemon-japan&q=${encodeURIComponent(query)}&view=grid&page=1`;

        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for the grid to load
        try {
            await page.waitForSelector('.search-result, .product-card__container', { timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for selector, checking content...');
        }

        // Extract data
        const cards = await page.evaluate(() => {
            const results = document.querySelectorAll('.search-result, .product-card__container');
            const data = [];

            results.forEach(el => {
                const titleEl = el.querySelector('.product-card__title');
                const priceEl = el.querySelector('.product-card__market-price--value');
                const setEl = el.querySelector('h4, .product-card__set-name');

                if (titleEl) {
                    data.push({
                        name: titleEl.innerText.trim(),
                        price: priceEl ? priceEl.innerText.trim() : 'N/A',
                        set: setEl ? setEl.innerText.trim() : '',
                        link: el.closest('a') ? el.closest('a').href : ''
                    });
                }
            });

            return data;
        });

        console.log(`Found ${cards.length} cards`);
        return cards;

    } catch (error) {
        console.error('Puppeteer Error:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
