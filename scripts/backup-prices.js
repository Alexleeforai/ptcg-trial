import mongoose from 'mongoose';
import Card from '../models/Card.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function backupPrices() {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGODB_URI);

    const cards = await Card.find({}).lean();
    console.log(`Found ${cards.length} cards to backup.`);

    // Create mapping: "SetID+CardNumber" -> Price
    // Problem: SNKRDUNK format is `[SetCode Num/Total]`.
    // TCGdex format is `SetCode-Num`.
    // matching logic required.

    // We will save RAW name and ID for fuzzy matching later.
    const backup = cards.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        set: c.set
    }));

    const dir = 'backups';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    fs.writeFileSync(path.join(dir, 'legacy_prices.json'), JSON.stringify(backup, null, 2));
    console.log(`Backup saved to ${dir}/legacy_prices.json`);

    process.exit(0);
}

backupPrices().catch(console.error);
