import mongoose from 'mongoose';

const DelayLogSchema = new mongoose.Schema(
    {
        flight_id: { 
            type: Number, 
            required: true, 
            index: true 
        },
        airline_id: { type: Number, required: true },
        delay_time_minutes: { type: Number, min: 0, required: true },
        reason: { type: String, required: true },
        status: { 
            type: String, 
            enum: ['Rescheduled', 'Cancelled'], 
            default: 'Rescheduled' 
        },
        actual_departure: { type: Date },
        logged_by: { type: String }, 
        created_at: { type: Date, default: Date.now }
    }, 
    { versionKey: false }
);

export default mongoose.model('DelayLog', DelayLogSchema, 'delay_logs');