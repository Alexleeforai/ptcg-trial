
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import { syncSetCodesToDatabase } from '../lib/googleSheets.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function sync() {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Starting Sync...");

    // Define how to update the DB
    const updateSetCode = async (setId, setCode) => {
        // Try strict match on setId first
        let result = await Card.updateMany(
            { setId: setId },
            { $set: { setCode: setCode } }
        );

        if (result.modifiedCount === 0 && result.matchedCount === 0) {
            // Fallback: Try regex match on setId if strict failed (optional, but risky)
            // Or try match on 'set' name field
            const result2 = await Card.updateMany(
                { set: setId }, // assuming user might have put Set Name in col A? No, instruction said Set ID.
                { $set: { setCode: setCode } }
            );
            return result2.modifiedCount;
        }

        return result.modifiedCount;
    };

    const stats = await syncSetCodesToDatabase(updateSetCode);

    console.log("\n-------------------------");
    console.log(`Sync Complete!`);
    console.log(`✅ Success (Sets updated): ${stats.success}`);
    console.log(`❌ Failed/Not Found:     ${stats.failed}`);
    console.log(`Total Rows Processed:    ${stats.total}`);
    console.log("-------------------------\n");

    process.exit(0);
}

sync().catch(console.error);
