const cheerio = require('cheerio');

async function testScrape() {
    try {
        const query = 'Iono';
        const url = `https://www.tcgplayer.com/search/pokemon-japan/product?productLineName=pokemon-japan&q=${query}&view=grid`;

        console.log(`Fetching ${url}...`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        if (!response.ok) {
            console.error('Response status:', response.status);
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const products = [];

        // Selectors found by browser agent
        $('.product-card__container, section.search-result').each((i, el) => {
            const name = $(el).find('.product-card__title').text().trim();
            const price = $(el).find('.product-card__market-price--value').text().trim();
            if (name) {
                products.push({ name, price });
            }
        });

        console.log('Found products:', products);

        if (products.length === 0) {
            console.log('HTML Preview (first 500 chars):', html.substring(0, 500));
        }

    } catch (error) {
        console.error('Scrape failed:', error);
    }
}

testScrape();
