import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function surgicalClean() {
    console.log("Connecting (Direct)...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Keywords to DELETE
    const blacklist = [
        'Yu-Gi-Oh', 'Duelist', 'Duel',
        'Blue-Eyes', 'Red-Eyes', 'Dark Magician',
        'Exodia', 'Obelisk', 'Slifer', 'Ra',
        'Hero', 'Stardust Dragon', 'Utopic', 'Galaxy-Eyes', 'Cyber Dragon',
        'Lunalight',
        'One Piece', 'Luffy', 'Zoro', 'Sanji', 'Nami', 'Kaido',
        'Labubu', 'Topps', 'Union Arena', 'Digimon', 'Weiss Schwarz'
    ];

    console.log(`Scanning for ${blacklist.length} blacklist keywords...`);

    let totalDeleted = 0;

    // Use regex for case-insensitive match
    // Construct single regex? Or Loop? Loop is safer to debug.

    for (const kw of blacklist) {
        // Special checks
        // "Hero" might match "Hero's Medal" (Pokemon Item)? 
        // Pokemon has "Hero" in names? "Hero's Cape", "Hero's Medal".
        // So "Hero" is dangerous.
        if (kw === 'Hero') continue; // Skip Hero for now.

        // "Duel" might match "Duel" in Pokemon? "Duel" is rare in Pokemon.

        const filter = { name: { $regex: kw, $options: 'i' } };
        const count = await Card.countDocuments(filter);

        if (count > 0) {
            console.log(`Found ${count} matches for "${kw}". Deleting...`);
            // List samples
            // const samples = await Card.find(filter).limit(3);
            // samples.forEach(s => console.log(`  HEAD: ${s.name}`));

            const res = await Card.deleteMany(filter);
            console.log(`  -> Deleted ${res.deletedCount}`);
            totalDeleted += res.deletedCount;
        }
    }

    // Special cleaner for "Piece" if "One Piece" didn't catch specific format
    // But "One Piece" usually appears in set name or card name?
    // If card name is just "Monkey D. Luffy", "One Piece" filter misses it.
    // So "Luffy" is good.

    console.log("\nTotal Deleted:", totalDeleted);
    console.log("Remaining Cards:", await Card.countDocuments({}));

    process.exit(0);
}

surgicalClean().catch(console.error);
