// Simple export script to generate CSV for Google Sheets
import { getAllSetsWithCodes } from '../lib/db.js';

async function exportSets() {
    try {
        const sets = await getAllSetsWithCodes();

        // CSV Header
        console.log('Set ID,Set Name,Set Code,Card Count');

        // CSV Rows
        sets.forEach(set => {
            const id = set.id || '';
            const name = (set.name || '').replace(/"/g, '""'); // Escape quotes
            const code = set.setCode || '';
            const count = set.count || 0;

            console.log(`"${id}","${name}","${code}",${count}`);
        });

        console.error(`\n✓ Exported ${sets.length} sets`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

exportSets();
