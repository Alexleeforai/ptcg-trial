import mongoose from 'mongoose';

const SetMetadataSchema = new mongoose.Schema({
    setId:       { type: String, required: true, unique: true }, // maps to Card.setId / Card.set
    name:        { type: String, default: '' },         // display name (auto-filled from Card.set)
    language:    { type: String, enum: ['english', 'japanese', 'chinese', ''], default: '' }, // '' = auto-detect
    releaseDate: { type: Date, default: null },
    coverImage:  { type: String, default: '' },         // custom cover URL, falls back to card image if empty
    updatedAt:   { type: Date, default: Date.now }
});

export default mongoose.models.SetMetadata || mongoose.model('SetMetadata', SetMetadataSchema);
