import mongoose from "mongoose";

const SagaLogSchema = new mongoose.Schema(
    {
        booking_id: { type: Number, required: true, index: true },
        step: { type: String, required: true },
        status: { type: String, required: true, enum: ['STARTED', 'SUCCESS', 'FAILED', 'COMPENSATED'] },
        message: { type: String },
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
        created_at: { type: Date, default: Date.now, index: { expires: '30d' } } // Tự động xóa log sau 30 ngày
    }, 
    { versionKey: false }
);

export default mongoose.model("SagaLog", SagaLogSchema, 'saga_logs');