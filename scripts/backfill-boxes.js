const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DB_PATH = path.join(process.cwd(), 'data', 'cards.json');

function readDB() {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

async function scrapeDate(page, url) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait briefly for hydration if needed, though raw DOM usually has it
        // Or wait for specific selector
        try {
            await page.waitForSelector('li.description__item', { timeout: 5000 });
        } catch (e) {
            // ignore timeout, might just be missing info
        }

        return await page.evaluate(() => {
            const descItems = document.querySelectorAll('li.description__item');
            let date = null;
            descItems.forEach(item => {
                const title = item.querySelector('.description__item-title');
                const info = item.querySelector('.description__item-info');
                if (title && title.innerText.includes('Release Date') && info) {
                    date = info.innerText.trim();
                }
            });
            return date;
        });
    } catch (e) {
        console.error(`Error scraping ${url}:`, e.message);
        return null;
    }
}

async function runBatch() {
    const allCards = readDB();

    // Prioritize Boxes without release date
    const targets = allCards.filter(c => !c.releaseDate && c.cardType === 'box');

    // If no boxes, maybe do some singles? 
    // For this run, let's just do boxes to ensure homepage is fixed quickly.
    // If user wants ALL, we can expand later, but let's start with high impact.
    if (targets.length === 0) {
        console.log("No boxes need backfilling.");
        // Optional: filter ANY card without date
        // const remaining = allCards.filter(c => !c.releaseDate).slice(0, 50); 
        return;
    }

    console.log(`Found ${targets.length} boxes to backfill...`);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        let count = 0;
        for (const card of targets) {
            count++;
            console.log(`[${count}/${targets.length}] Scraping ${card.name}...`);

            // Construct full URL if link is relative or verify it exists
            // Existing data has 'link' field
            if (!card.link) {
                console.log("No link found, skipping.");
                continue;
            }

            const releaseDate = await scrapeDate(page, card.link);

            if (releaseDate) {
                console.log(`  -> Found: ${releaseDate}`);
                card.releaseDate = releaseDate;
                card.updatedAt = new Date().toISOString();

                // Save incrementally every 5 items to be safe
                if (count % 5 === 0) {
                    writeDB(allCards);
                    console.log("  (Saved Progress)");
                }
            } else {
                console.log("  -> Not found.");
            }

            // Nice delay to be polite
            await new Promise(r => setTimeout(r, 2000));
        }

        // Final save
        writeDB(allCards);
        console.log("Batch complete. Saved.");

    } catch (e) {
        console.error("Fatal Error:", e);
    } finally {
        await browser.close();
    }
}

runBatch();
