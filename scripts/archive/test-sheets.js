import { readSetCodesFromSheet } from '../lib/googleSheets.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testConnection() {
    console.log('Testing Google Sheets connection...');
    console.log(`Sheet ID: ${process.env.GOOGLE_SHEETS_SHEET_ID}`);
    console.log(`Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);

    try {
        const rows = await readSetCodesFromSheet();
        console.log('Successfully connected!');
        console.log(`Found ${rows.length} rows.`);
        if (rows.length > 0) {
            console.log('First row sample:', rows[0]);
        }
    } catch (error) {
        console.error('Connection failed:', error);
        // Clean up error message for display
        if (error.code === 403) {
            console.error('\nPOSSIBLE CAUSE: The Service Account Email has not been invited to the Sheet.');
            console.error(`Please share the sheet with: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
        }
    }
}

testConnection();
