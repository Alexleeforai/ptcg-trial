import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { fetchSnkrdunkTradingCardQuote } from '@/lib/snkrdunk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 40;
const DELAY_MS = 600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Refresh JPY Card.price from SNKRDUNK for rows that have snkrdunkProductId.
 * PriceCharting fields (priceRaw, etc.) are not modified here.
 */
export async function GET() {
    try {
        await connectToDatabase();

        const cards = await Card.find({
            snkrdunkProductId: { $exists: true, $ne: null, $gt: 0 }
        })
            .sort({ snkrdunkUpdatedAt: 1 })
            .limit(BATCH)
            .select({ id: 1, snkrdunkProductId: 1 })
            .lean();

        const report = [];

        for (const row of cards) {
            const pid = row.snkrdunkProductId;
            try {
                const quote = await fetchSnkrdunkTradingCardQuote(pid);
                if (!quote) {
                    report.push({ id: row.id, snkrdunkProductId: pid, status: 'no_quote' });
                } else {
                    const updateFields = {
                        price: quote.priceJpy,
                        currency: 'JPY',
                        snkrdunkUpdatedAt: new Date(),
                        updatedAt: new Date()
                    };
                    if (quote.priceHkd != null)       updateFields.snkrdunkPriceHkd      = quote.priceHkd;
                    if (quote.priceUsd != null)       updateFields.snkrdunkPriceUsd      = quote.priceUsd;
                    if (quote.pricePSA10Hkd != null)  updateFields.snkrdunkPricePSA10Hkd = quote.pricePSA10Hkd;
                    if (quote.pricePSA9Hkd != null)   updateFields.snkrdunkPricePSA9Hkd  = quote.pricePSA9Hkd;
                    if (quote.pricePSA10Usd != null)  updateFields.snkrdunkPricePSA10Usd = quote.pricePSA10Usd;
                    if (quote.pricePSA9Usd != null)   updateFields.snkrdunkPricePSA9Usd  = quote.pricePSA9Usd;
                    if (quote.pricePSA10Jpy != null)  updateFields.snkrdunkPricePSA10    = quote.pricePSA10Jpy;
                    if (quote.pricePSA9Jpy != null)   updateFields.snkrdunkPricePSA9     = quote.pricePSA9Jpy;

                    await Card.updateOne({ id: row.id }, { $set: updateFields });
                    report.push({
                        id: row.id,
                        snkrdunkProductId: pid,
                        status: 'ok',
                        priceJpy: quote.priceJpy,
                        priceUsd: quote.priceUsd,
                        sourceCurrency: quote.currency,
                        sourceMin: quote.minPrice
                    });
                }
            } catch (e) {
                report.push({ id: row.id, snkrdunkProductId: pid, status: 'error', error: e.message });
            }
            await sleep(DELAY_MS);
        }

        return NextResponse.json({
            success: true,
            processed: report.length,
            results: report
        });
    } catch (error) {
        console.error('[Cron SNKRDUNK]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
