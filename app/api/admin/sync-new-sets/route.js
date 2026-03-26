import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Card from '@/models/Card';
import { getAllSetsFromPC, getCardsFromSet } from '@/lib/priceCharting';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
    try {
        // --- Auth: Admin only ---
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Please login' }, { status: 401 });
        }
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden: Admins only' }, { status: 403 });
        }

        await connectToDatabase();

        // --- Step 0: Get params ---
        let force = false;
        try {
            const body = await req.json();
            force = !!body.force;
        } catch (e) {
            // No body or not JSON, default to false
        }

        // --- Step 1: Get all sets from PriceCharting ---
        const pcSets = await getAllSetsFromPC();

        // --- Step 2: Filter logic ---
        let targetSets = [];
        if (force) {
            targetSets = pcSets;
        } else {
            // Get all setIds already in our DB
            const existingSetIds = await Card.distinct('setId');
            const existingSetIdSet = new Set(existingSetIds);
            targetSets = pcSets.filter(s => !existingSetIdSet.has(s.id));
        }

        if (targetSets.length === 0) {
            return NextResponse.json({
                success: true,
                message: '✅ 冇嘢需要更新！',
                newSetsFound: 0,
                totalCardsAdded: 0,
                sets: []
            });
        }

        // --- Step 4: Scrape and import each target set (Streamed Execution) ---
        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (event, data) => {
                    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(payload));
                };

                let totalCardsAdded = 0;
                let processedCount = 0;
                const report = [];

                try {
                    for (const set of targetSets) {
                        try {
                            const cards = await getCardsFromSet(set);

                            if (cards.length > 0) {
                                const bulkOps = cards.map(card => ({
                                    updateOne: {
                                        filter: { id: card.id },
                                        update: { $set: card },
                                        upsert: true
                                    }
                                }));
                                await Card.bulkWrite(bulkOps);
                                totalCardsAdded += cards.length;
                                report.push({ setId: set.id, name: set.name, cardsAdded: cards.length, status: 'ok' });
                            } else {
                                report.push({ setId: set.id, name: set.name, cardsAdded: 0, status: 'empty' });
                            }
                        } catch (e) {
                            console.error(`[sync-new-sets] Error on set ${set.name}: ${e.message}`);
                            report.push({ setId: set.id, name: set.name, cardsAdded: 0, status: 'error', error: e.message });
                        }

                        processedCount++;
                        // Send progress update
                        sendEvent('progress', {
                            current: processedCount,
                            total: targetSets.length,
                            currentSet: set.name
                        });
                    }

                    // Send final completion event
                    sendEvent('complete', {
                        success: true,
                        newSetsFound: targetSets.length,
                        totalCardsAdded,
                        sets: report
                    });

                } catch (error) {
                    console.error('[sync-new-sets] Stream Fatal error:', error);
                    sendEvent('error', { error: error.message });
                } finally {
                    controller.close();
                }
            }
        });

        // Return the SSE stream
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('[sync-new-sets] Fatal error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
