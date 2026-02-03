import { google } from 'googleapis';
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Google Sheets API
function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
}

async function populateSheets() {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Fetching all sets...');
    const sets = await Card.aggregate([
        { $group: { _id: '$setId', name: { $first: '$set' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);

    console.log(`Found ${sets.length} sets.`);

    // Prepare data for Google Sheets
    const rows = [
        ['A (Set ID)', 'B (Set Name)', 'C (Set Code)'] // Header
    ];

    sets.forEach(set => {
        rows.push([
            set._id || '',           // Set ID
            set.name || '',          // Set Name
            ''                       // Set Code (empty for user to fill)
        ]);
    });

    // Write to Google Sheets
    const sheets = getGoogleSheetsClient();
    const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID;

    console.log('Writing to Google Sheets...');

    await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:C',
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
            values: rows
        }
    });

    console.log(`\n✅ Successfully wrote ${rows.length - 1} sets to Google Sheets!`);
    console.log(`Sheet: https://docs.google.com/spreadsheets/d/${sheetId}`);

    process.exit(0);
}

populateSheets().catch(console.error);
