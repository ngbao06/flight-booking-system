import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
    {
        user_id: { 
            type: Number, 
            required: true, 
            index: true 
        },
        role: { 
            type: String, 
            required: true,
            enum: ['ADMIN', 'GATE_AGENT', 'PASSENGER'] 
        },
        action: { 
            type: String, 
            required: true,
            enum: ['LOGIN', 'LOGOUT', 'SEARCH_FLIGHT', 'BOOKING_INIT', 'PAYMENT_SUCCESS']
        },
        details: {
            type: mongoose.Schema.Types.Mixed, 
            default: {}
        },
        device_info: {
            browser: String,
            os: String,
            ip_address: String
        },
        timestamp: { 
            type: Date, 
            default: Date.now,
            index: { expires: '180d' }
        }
    }, 
    { versionKey: false }
);

export default mongoose.model('ActivityLog', ActivityLogSchema, 'activity_logs');