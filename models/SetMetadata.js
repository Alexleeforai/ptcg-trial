import mongoose from 'mongoose';

const SetMetadataSchema = new mongoose.Schema({
    setId:       { type: String, required: true, unique: true },
    name:        { type: String, default: '' },
    language:    { type: String, enum: ['english', 'japanese', 'chinese', ''], default: '' },
    releaseDate: { type: Date, default: null },
    coverImage:  { type: String, default: '' },
    coverImagePosition: { type: String, default: '50% 50%' },
    updatedAt:   { type: Date, default: Date.now }
});

// In dev, always recompile so schema changes (new fields) are picked up
// without needing a full server restart
if (process.env.NODE_ENV !== 'production' && mongoose.models.SetMetadata) {
    delete mongoose.models.SetMetadata;
}

export default mongoose.models.SetMetadata || mongoose.model('SetMetadata', SetMetadataSchema);
