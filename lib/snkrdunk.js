import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

// Helper to launch browser compatible with Serverless (Vercel) & Local
async function getBrowser() {
    // Check if running on Vercel (or production environment where full chrome isn't available)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    if (isProduction) {
        try {
            return await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
        } catch (e) {
            console.error("Failed to launch serverless browser", e);
            // Fallback just in case
        }
    }

    // Local Development
    return await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
}

export async function searchSnkrdunk(query) {
    let browser;
    try {
        browser = await getBrowser();


        const page = await browser.newPage();

        // 1. Set User Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 2. Navigate to SNKRDUNK Search
        const url = `https://snkrdunk.com/en/search/result?keyword=${encodeURIComponent(query)}`;

        // Wait for network idle or timeout after 15s
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 3. Click "Streetwear & TCG" Tab to switch to cards
        try {
            await page.waitForSelector('body'); // ensure body logic
            await page.evaluate(() => {
                const xpath = "//*[contains(text(), 'Streetwear') and contains(text(), 'TCG')]";
                const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const node = result.singleNodeValue;
                if (node) {
                    node.click();
                } else {
                    console.log("Tab not found via xpath");
                }
            });
            // Wait for results to update
            await new Promise(r => setTimeout(r, 3000));
        } catch (e) {
            console.error("Error switching tabs:", e);
        }

        // 4. Wait for results again
        try {
            await page.waitForSelector('.product__item', { timeout: 5000 });
        } catch (e) {
            console.log('No .product__item found after tab switch...');
        }

        // 5. Extract Data
        const cards = await page.evaluate(() => {
            const items = document.querySelectorAll('.product__item');
            const results = [];

            items.forEach(item => {
                const linkEl = item.querySelector('a');
                if (!linkEl) return;

                const href = linkEl.href;
                // STRICT FILTER: Only Trading Cards
                if (!href.includes('/trading-cards/')) return;

                const nameEl = item.querySelector('.product__item-name');
                const priceEl = item.querySelector('.product__item-price');
                const imgEl = item.querySelector('img');

                if (nameEl) {
                    const priceText = priceEl ? priceEl.innerText : '0';
                    // Parse "Starting from ¥2,000~" -> 2000
                    const priceMatch = priceText.replace(/,/g, '').match(/(\d+)/);
                    const price = priceMatch ? parseInt(priceMatch[0], 10) : 0;

                    let image = imgEl ? imgEl.src : '';
                    if (!image && imgEl && imgEl.getAttribute('data-src')) {
                        image = imgEl.getAttribute('data-src');
                    }

                    const idMatch = href.match(/\/trading-cards\/(\d+)/);
                    const id = idMatch ? idMatch[1] : `snkr-${Math.random().toString(36).substr(2, 9)}`;

                    results.push({
                        id: `snkr-${id}`,
                        name: nameEl.innerText.trim(),
                        nameJP: nameEl.innerText.trim(),
                        image: image,
                        price: price, // JPY
                        set: 'SNKRDUNK',
                        link: href
                    });
                }
            });

            return results;
        });

        console.log(`Found ${cards.length} cards on SNKRDUNK`);
        return cards;

    } catch (error) {
        console.error('Puppeteer/SNKRDUNK Error:', error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export async function getSnkrdunkCard(snkrdunkId) {
    let browser;
    try {
        browser = await getBrowser();

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = `https://snkrdunk.com/en/trading-cards/${snkrdunkId}`;
        console.log(`Scraping card detail: ${url}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        try {
            await page.waitForSelector('h1.product-detail__name', { timeout: 10000 });
        } catch (e) {
            console.error("Timeout waiting for product name");
        }

        const cardData = await page.evaluate(() => {
            const nameEl = document.querySelector('h1.product-detail__name');
            const priceEl = document.querySelector('p.product-detail__price');
            const imgEl = document.querySelector('.product-detail__img-area img');

            if (!nameEl) return null;

            const name = nameEl.innerText.trim();
            const priceText = priceEl ? priceEl.innerText : '0';
            const priceMatch = priceText.replace(/,/g, '').match(/(\d+)/);
            const price = priceMatch ? parseInt(priceMatch[0], 10) : 0;

            let image = imgEl ? imgEl.src : '';
            if (!image && imgEl && imgEl.dataset && imgEl.dataset.src) {
                image = imgEl.dataset.src;
            } else if (!image && imgEl && imgEl.getAttribute('data-src')) {
                image = imgEl.getAttribute('data-src');
            }

            // Extract Release Date
            // Look for label "Release Date" in description items
            let releaseDate = null;
            const descItems = document.querySelectorAll('li.description__item');
            descItems.forEach(item => {
                const title = item.querySelector('.description__item-title');
                const info = item.querySelector('.description__item-info');
                if (title && title.innerText.includes('Release Date') && info) {
                    releaseDate = info.innerText.trim();
                }
            });

            return {
                name,
                nameJP: name, // Detail page usually has the English/Romaji name often, but we treat as generic
                price,
                image,
                releaseDate,
                set: 'SNKRDUNK',
                // Link is the current page we are on, we can construct it or pass it. 
                // We'll return it as null and let caller fill it or use window.location if we could.
            };
        });

        if (cardData) {
            return {
                id: `snkr-${snkrdunkId}`,
                ...cardData,
                link: url
            };
        }
        return null;

    } catch (e) {
        console.error("Error scraping card detail:", e);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}
