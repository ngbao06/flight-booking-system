import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema(
    {
        _id: { 
            type: Number, 
            required: true 
        },
        display_name: { type: String, trim: true },
        avatar_url: { type: String, default: null },
        contact: {
            email: { type: String, lowercase: true, trim: true },
            phone: { type: String, trim: true },
            address: { type: String }
        },
        passport: {
            number: { type: String, uppercase: true },
            expiry_date: { type: Date },
            nationality: { type: String }
        },
        preferences: {
            meal: { type: String, default: 'Standard' },
            seat_position: { type: String, enum: ['window', 'aisle', 'none'], default: 'none' }
        },
        frequent_flyers: [
            {
                full_name: String,
                relationship: String,
                passport_number: String
            }
        ]
    }, 
    { 
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        versionKey: false 
    }
);

export default mongoose.model('UserProfile', UserProfileSchema, 'users_profile');