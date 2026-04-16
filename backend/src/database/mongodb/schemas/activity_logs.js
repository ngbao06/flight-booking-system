import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
    {
        user_id:   { type: Number, required: true, index: true },
        role:      { type: String, required: true, enum: ['ADMIN', 'GATE_AGENT', 'PASSENGER'] },
        module:    { type: String, required: true },
        action:    { type: String, required: true },
        id:        { type: Number },
        old_data:  { type: mongoose.Schema.Types.Mixed, default: {}},
        new_data:  { type: mongoose.Schema.Types.Mixed, default: {}},
        createdAt: { type: Date, default: Date.now, index: { expires: '180d' } }
    }, 
    { versionKey: false }
);

export default mongoose.model('ActivityLog', ActivityLogSchema, 'activity_logs');