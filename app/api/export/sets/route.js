import { NextResponse } from 'next/server';
import { getAllSetsWithCodes } from '@/lib/db';

// Export sets as CSV
export async function GET() {
    try {
        const sets = await getAllSetsWithCodes();

        // Generate CSV
        let csv = 'Set ID,Set Name,Set Code,Card Count\n';

        sets.forEach(set => {
            const id = (set.id || '').replace(/"/g, '""');
            const name = (set.name || '').replace(/"/g, '""');
            const code = (set.setCode || '').replace(/"/g, '""');
            const count = set.count || 0;

            csv += `"${id}","${name}","${code}",${count}\n`;
        });

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="sets-export.csv"'
            }
        });
    } catch (error) {
        console.error('[Export] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
