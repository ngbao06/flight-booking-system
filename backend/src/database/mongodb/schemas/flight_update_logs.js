import mongoose from 'mongoose';

const FlightUpdateLogSchema = new mongoose.Schema(
    {
        flight_id: { type: Number, required: true, index: true },
        status: { 
            type: String, 
            enum: ['WAITING','DELAYED','CANCELED','IN_PROGRESS','COMPLETED'], 
            default: 'DELAYED' ,
            required: true,
            index: true
        },
        old_data:   { type: mongoose.Schema.Types.Mixed, default: {}},
        new_data:   { type: mongoose.Schema.Types.Mixed, default: {}},
        reason:     { type: String, required: true },
        updated_by: { type: String, required: true },
        created_at: { type: Date, default: Date.now }
    }, 
    { versionKey: false }
);

FlightUpdateLogSchema.index({ flight_id: 1, created_at: -1 });

export default mongoose.model('FlightUpdateLog', FlightUpdateLogSchema, 'flight_update_logs');