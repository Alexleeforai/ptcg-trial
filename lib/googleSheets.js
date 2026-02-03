import { google } from 'googleapis';

// Initialize Google Sheets API
function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return google.sheets({ version: 'v4', auth });
}

/**
 * Read Set Codes from Google Sheet
 * Expected columns: A = Set ID, B = Set Name, C = Set Code
 * @returns {Promise<Array<{setId: string, setCode: string}>>}
 */
export async function readSetCodesFromSheet() {
    try {
        const sheets = getGoogleSheetsClient();
        const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID;

        if (!sheetId) {
            throw new Error('GOOGLE_SHEETS_SHEET_ID not configured');
        }

        // Read data from Sheet (columns A, B, C)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Sheet1!A2:C', // Skip header row
        });

        const rows = response.data.values || [];

        return rows
            .filter(row => row[0] && row[2]) // Must have Set ID and Set Code
            .map(row => ({
                setId: row[0].trim(),
                setName: row[1]?.trim() || '',
                setCode: row[2]?.trim() || ''
            }));
    } catch (error) {
        console.error('[Google Sheets] Read error:', error);
        throw error;
    }
}

/**
 * Sync Set Codes from Google Sheet to Database
 * @param {Function} updateSetCode - DB function to update set codes
 * @returns {Promise<{success: number, failed: number, total: number}>}
 */
export async function syncSetCodesToDatabase(updateSetCode) {
    const setCodes = await readSetCodesFromSheet();

    let success = 0;
    let failed = 0;

    for (const { setId, setCode } of setCodes) {
        try {
            const modifiedCount = await updateSetCode(setId, setCode);
            if (modifiedCount > 0) {
                success++;
            } else {
                console.warn(`[Sync] No cards found for set: ${setId}`);
                failed++;
            }
        } catch (error) {
            console.error(`[Sync] Failed to update ${setId}:`, error);
            failed++;
        }
    }

    return {
        success,
        failed,
        total: setCodes.length
    };
}
