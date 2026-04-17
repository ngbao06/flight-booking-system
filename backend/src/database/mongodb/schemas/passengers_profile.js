import mongoose from 'mongoose';

const PassengerProfileSchema = new mongoose.Schema(
    {
        _id: { 
            type: Number, 
            required: true 
        },
        full_name: { type: String, trim: true },
        avatar_url:   { type: String, default: null },
        contact: {
            email:   { type: String, lowercase: true, trim: true },
            phone:   { type: String, trim: true },
            address: { type: String }
        },
        passport: {
            number:      { type: String, uppercase: true },
            expiry_date: { type: Date },
            nationality: { type: String }
        },
        preferences: {
            meal:          { type: String, default: 'Standard' },
            seat_position: { type: String, enum: ['window', 'aisle', 'none'], default: 'none' }
        }
    }, 
    { 
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false 
    }
);

export default mongoose.model('PassengerProfile', PassengerProfileSchema, 'passengers_profile');