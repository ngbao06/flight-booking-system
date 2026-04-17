import mongoose from 'mongoose';

const LoyaltyLogSchema = new mongoose.Schema(
    {
        passenger_id: { type: Number, required: true, index: true },
        miles_traveled:   { type: Number },
        points_received:  { type: Number },
        points_exchanged: { type: Number },
        old_data:   { type: mongoose.Schema.Types.Mixed, default: {}},
        new_data:   { type: mongoose.Schema.Types.Mixed, default: {}},
        created_at: { type: Date, default: Date.now }
    }, 
    { versionKey: false }
);


export default mongoose.model('LoyaltyLog', LoyaltyLogSchema, 'loyalty_logs');