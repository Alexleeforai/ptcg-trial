
import puppeteer from 'puppeteer';

async function investigate() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Allow request interception
        await page.setRequestInterception(true);
        page.on('request', req => req.continue());

        page.on('response', async res => {
            const url = res.url();
            if (url.includes('history') || url.includes('sales') || url.includes('chart') || url.includes('graph')) {
                console.log(`[Network] Potential History URL: ${url}`);
                try {
                    const json = await res.json();
                    console.log('   -> JSON Data Preview:', JSON.stringify(json).substring(0, 200));
                } catch (e) {
                    // ignore non-json
                }
            }
        });

        const targetUrl = 'https://snkrdunk.com/en/trading-cards/128747'; // A likely valid ID (Charizard?) or random one
        // Wait, I need a valid ID. Let's use one from my previous scrape if I recall. 
        // 128747 is random. Let's use one that definitely exists.
        // I will trust the user provided image or just search for one.
        // Actually, let's search for "Charizard" first to get a valid URL, then go there.

        console.log("Searching for a valid card to test...");
        await page.goto('https://snkrdunk.com/en/search/result?keyword=Charizard', { waitUntil: 'networkidle2' });

        // Click first result
        const cardLink = await page.evaluate(() => {
            const item = document.querySelector('.product__item a');
            return item ? item.href : null;
        });

        if (!cardLink) {
            console.error("No card found to test.");
            return;
        }

        console.log(`Navigating to card: ${cardLink}`);
        await page.goto(cardLink, { waitUntil: 'networkidle2' });

        // Check for global variables
        const globals = await page.evaluate(() => {
            // Check for common data stores
            return {
                __NEXT_DATA__: window.__NEXT_DATA__,
                initialState: window.__INITIAL_STATE__,
                chartData: window.chartData,
                salesHistory: window.salesHistory
            };
        });

        if (globals.__NEXT_DATA__) {
            console.log("Found __NEXT_DATA__!");
            // Search deeply for "history" or "sales"
            const str = JSON.stringify(globals.__NEXT_DATA__);
            if (str.includes('history') || str.includes('sales') || str.includes('price_history')) {
                console.log("   -> Contains 'history' keyword!");
                // Try to find the path? Too complex to regex here, but good signal.
            } else {
                console.log("   -> __NEXT_DATA__ does not seem to contain history.");
            }
        } else {
            console.log("No __NEXT_DATA__ found.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

investigate();
