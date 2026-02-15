
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Define Minimal Card Schema for deletion
const CardSchema = new mongoose.Schema({
    set: String,
    source: String
}, { strict: false });

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

async function cleanup() {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete where set is SNKRDUNK or source is SNKRDUNK
        // Based on cards.json, it seems 'set' is SNKRDUNK.
        // Let's count first.
        const query = {
            $or: [
                { set: 'SNKRDUNK' },
                { source: 'SNKRDUNK' },
                { id: { $regex: /^snkr-/ } } // ID prefix check as backup
            ]
        };

        const count = await Card.countDocuments(query);
        console.log(`🔍 Found ${count} cards to delete.`);

        if (count > 0) {
            const result = await Card.deleteMany(query);
            console.log(`🗑️ Deleted ${result.deletedCount} cards.`);
        } else {
            console.log('✨ No SNKRDUNK cards found.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

cleanup();
