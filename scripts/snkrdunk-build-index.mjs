/**
 * Build/update SNKRDUNK trading-card index from public sitemaps.
 *
 * Usage:
 *   node scripts/snkrdunk-build-index.mjs --mode=incremental --sitemap-limit=1
 *   node scripts/snkrdunk-build-index.mjs --mode=full --sitemap-limit=8
 *   node scripts/snkrdunk-build-index.mjs --mode=full --sitemap-offset=2 --sitemap-limit=2
 *   node scripts/snkrdunk-build-index.mjs --mode=incremental --max-urls=3000
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import zlib from 'zlib';
import SnkrdunkIndex from '../models/SnkrdunkIndex.js';

dotenv.config({ path: '.env.local' });

const INDEX_URL =
    'https://snkrdunk.com/en/sitemap/sitemap-index-en-product-trading-card-single.xml';

const UA =
    process.env.SNKRDUNK_UA ||
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function parseArgs() {
    const args = Object.fromEntries(
        process.argv.slice(2).map((a) => {
            const [k, v = 'true'] = a.replace(/^--/, '').split('=');
            return [k, v];
        })
    );
    return {
        mode: (args.mode || 'incremental').toLowerCase(), // incremental | full
        sitemapLimit: Math.max(1, Number(args['sitemap-limit'] || 1)),
        sitemapOffset: Math.max(0, Number(args['sitemap-offset'] || 0)),
        maxUrls: Math.max(0, Number(args['max-urls'] || 0)), // 0 = no limit
        dryRun: args['dry-run'] === 'true',
    };
}

async function fetchText(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/xml,text/xml,*/*' },
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
    return await res.text();
}

function extractLocs(xmlText) {
    const out = [];
    const re = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(xmlText))) out.push(m[1].trim());
    return out;
}

async function fetchGzipXml(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return zlib.gunzipSync(buf).toString('utf8');
}

function parseCardEntry(url) {
    // Example URL: https://snkrdunk.com/en/trading-cards/123456
    const idMatch = url.match(/\/trading-cards\/(\d+)/);
    if (!idMatch) return null;
    const productId = Number(idMatch[1]);
    if (!Number.isFinite(productId) || productId <= 0) return null;
    return { productId, url };
}

async function fetchProductPageInfo(productId) {
    const url = `https://snkrdunk.com/en/trading-cards/${productId}`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
            signal: AbortSignal.timeout(8000),
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const html = await res.text();
        // Pokemon style bracket: [M2a 049/193]
        const bracketMatch = html.match(/\[([A-Za-z0-9+]+)\s+(\d+)\/(\d+)\]/);
        if (!bracketMatch) return null;
        const titleMatch = html.match(/<title>([^<]*)/i);
        const name = titleMatch ? titleMatch[1].split('|')[0].trim() : '';
        return {
            setCode: bracketMatch[1],
            setCodeLower: bracketMatch[1].toLowerCase(),
            cardNum: Number(bracketMatch[2]),
            denom: Number(bracketMatch[3]),
            name,
            url,
        };
    } catch {
        return null;
    }
}

async function processSitemap(sitemapUrl, { dryRun = false, maxUrls = 0 } = {}) {
    const xml = await fetchGzipXml(sitemapUrl);
    const locs = extractLocs(xml).filter((u) => u.includes('/en/trading-cards/'));
    const allEntries = locs.map(parseCardEntry).filter(Boolean);
    const entries = maxUrls > 0 ? allEntries.slice(0, maxUrls) : allEntries;

    let parsed = 0;
    let upserted = 0;
    let skipped = 0;
    const batchSize = 25;

    for (let i = 0; i < entries.length; i += batchSize) {
        const chunk = entries.slice(i, i + batchSize);
        const infos = await Promise.all(
            chunk.map(async (e) => {
                const info = await fetchProductPageInfo(e.productId);
                if (!info) return null;
                return {
                    ...info,
                    productId: e.productId,
                    sourceSitemap: sitemapUrl,
                    lastSeenAt: new Date(),
                };
            })
        );

        const docs = infos.filter(Boolean);
        parsed += docs.length;
        skipped += chunk.length - docs.length;

        if (!dryRun && docs.length > 0) {
            const ops = docs.map((d) => ({
                updateOne: {
                    filter: { productId: d.productId },
                    update: { $set: d, $setOnInsert: { createdAt: new Date() } },
                    upsert: true,
                },
            }));
            const res = await SnkrdunkIndex.bulkWrite(ops, { ordered: false });
            upserted += (res.upsertedCount || 0) + (res.modifiedCount || 0);
        } else {
            upserted += docs.length;
        }
    }

    return {
        sitemapUrl,
        totalUrls: entries.length,
        parsed,
        skipped,
        upserted,
    };
}

async function main() {
    const args = parseArgs();
    await mongoose.connect(process.env.MONGODB_URI);

    const indexXml = await fetchText(INDEX_URL);
    let sitemapUrls = extractLocs(indexXml).filter((u) => u.endsWith('.xml.gz'));
    if (sitemapUrls.length === 0) throw new Error('No sitemap urls found');

    // incremental: process latest N files; full: process from offset.
    if (args.mode === 'incremental') {
        sitemapUrls = sitemapUrls.slice(-args.sitemapLimit);
    } else {
        sitemapUrls = sitemapUrls.slice(args.sitemapOffset, args.sitemapOffset + args.sitemapLimit);
    }

    console.log(
        `[snkrdunk-build-index] mode=${args.mode} dryRun=${args.dryRun} maxUrls=${args.maxUrls || 'all'} processing ${sitemapUrls.length} sitemap files`
    );

    let total = { urls: 0, parsed: 0, skipped: 0, upserted: 0 };
    for (const url of sitemapUrls) {
        const result = await processSitemap(url, { dryRun: args.dryRun, maxUrls: args.maxUrls });
        total.urls += result.totalUrls;
        total.parsed += result.parsed;
        total.skipped += result.skipped;
        total.upserted += result.upserted;
        console.log(
            `  -> ${result.sitemapUrl}\n     urls=${result.totalUrls} parsed=${result.parsed} skipped=${result.skipped} upserted=${result.upserted}`
        );
    }

    const indexCount = await SnkrdunkIndex.countDocuments({});
    console.log(
        `\n[done] processedUrls=${total.urls} parsed=${total.parsed} skipped=${total.skipped} upserted=${total.upserted} indexCount=${indexCount}`
    );
    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error('[snkrdunk-build-index] failed:', err);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});

