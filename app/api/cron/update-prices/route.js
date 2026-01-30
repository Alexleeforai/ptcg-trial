import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { getCardsFromSet } from '@/lib/priceCharting';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max execution time to 60s (Pro) or 10s (Hobby) - try to push it

export async function GET(request) {
    try {
        await connectToDatabase();

        // 1. Identify "Oldest" Sets
        // Group cards by setId, find the minimum (oldest) updatedAt for each set
        const oldestSets = await Card.aggregate([
            {
                $group: {
                    _id: "$setId",
                    setName: { $first: "$set" }, // Assuming all cards in set have same set name
                    minUpdatedAt: { $min: "$updatedAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { minUpdatedAt: 1 } },
            { $limit: 5 }
        ]);

        if (oldestSets.length === 0) {
            return NextResponse.json({ message: 'No sets found in DB' });
        }

        const report = [];

        // 2. Loop and Update
        for (const setInfo of oldestSets) {
            // Reconstruct Set Object for Scraper
            // Warning: We need the Source URL. 
            // If DB doesn't have it on the Set level (we don't have Set model), 
            // we rely on standardized URL structure: /console/{setId}
            // `setId` in our DB corresponds to the slug in PriceCharting URL.

            const setObj = {
                id: setInfo._id,
                name: setInfo.setName,
                url: `/console/${setInfo._id}`
            };

            console.log(`[Cron] Updating set: ${setObj.name} (Last updated: ${setInfo.minUpdatedAt})`);

            // Scrape
            // Note: getCardsFromSet returns array of card objects
            const scrapedCards = await getCardsFromSet(setObj);

            if (scrapedCards.length > 0) {
                // Bulk Upsert
                const bulkOps = scrapedCards.map(card => ({
                    updateOne: {
                        filter: { id: card.id },
                        update: {
                            $set: {
                                priceRaw: card.priceRaw,
                                priceGrade9: card.priceGrade9,
                                pricePSA10: card.pricePSA10,
                                updatedAt: new Date(),
                                // Don't overwrite existing name/image if not necessary to preserve edits? 
                                // Actually, refresh usually implies trusting source.
                                // But let's be safe and update price mainly.
                                // If we want to find "New cards", we should upsert everything.
                            },
                            $setOnInsert: {
                                name: card.name,
                                set: card.set,
                                setId: card.setId,
                                image: card.image, // likely null from list view
                                currency: card.currency,
                                sourceUrl: card.sourceUrl,
                                createdAt: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                await Card.bulkWrite(bulkOps);
                report.push({ set: setObj.name, count: scrapedCards.length, status: 'Updated' });
            } else {
                report.push({ set: setObj.name, count: 0, status: 'No data found' });
            }
        }

        return NextResponse.json({
            success: true,
            updatedSets: report
        });

    } catch (error) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
