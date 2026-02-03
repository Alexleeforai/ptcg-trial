import { NextResponse } from 'next/server';
import { syncSetCodesToDatabase } from '@/lib/googleSheets';
import { updateSetCode } from '@/lib/db';

// Auto-sync endpoint - can be called by Vercel Cron or manually
export async function GET(request) {
    try {
        // Optional: Add auth check for manual calls
        // const { userId } = await auth();

        console.log('[Auto-Sync] Starting Google Sheets sync...');

        const result = await syncSetCodesToDatabase(updateSetCode);

        console.log('[Auto-Sync] Completed:', result);

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Auto-Sync] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggers
export const POST = GET;
