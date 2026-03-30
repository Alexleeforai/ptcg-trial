import mongoose from 'mongoose';

// Stores arbitrary site-wide config as key-value documents
const SiteConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: '' },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);
