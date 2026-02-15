
import mongoose from 'mongoose';

const MerchantProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    shopName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: String,
    address: String,
    description: String,
    instagram: String, // Instagram Handle or URL
    shopIcon: String, // Base64 string or URL
    logoUrl: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.models.MerchantProfile || mongoose.model('MerchantProfile', MerchantProfileSchema);
