
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(process.env.MONGODB_URI);
};

const CardSchema = new mongoose.Schema({}, { strict: false });
const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

async function checkImages() {
    await connectDB();
    // Search by Set Name (partial)
    const card = await Card.findOne({ set: { $regex: 'Chinese Gem Pack 3', $options: 'i' } });

    if (card) {
        console.log(`Found Card: ${card.name}`);
        console.log(`Original: ${card.image}`);

        const testUrl = card.image.replace('60.jpg', '240.jpg');
        console.log(`Testing: ${testUrl}`);

        try {
            const res = await fetch(testUrl, { method: 'HEAD' });
            if (res.ok) {
                console.log(`[SUCCESS] Found 240.jpg: ${testUrl}`);
            } else {
                console.log(`[FAILED] 240.jpg not found (Status: ${res.status})`);
            }
        } catch (e) {
            console.log(`[ERROR] ${e.message}`);
        }
    } else {
        console.log('No card found in Chinese Gem Pack 3');
    }

    process.exit();
}

checkImages();
