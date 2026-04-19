/**
 * Saga Orchestration Initializer
 * Sets up the booking saga workflow when the application starts
 */

import SagaManager from './sagaManager.js';

const initSagaOrchestration = () => {
    console.log('🔄 Initializing Saga Orchestration System...');
    
    try {
        // SagaManager is already initialized as a singleton
        // It sets up all event listeners in its constructor
        
        console.log('✅ Saga Orchestration System initialized');
        console.log('📋 Saga Events:', [
            'BOOKING_CREATED',
            'SEAT_SELECTED',
            'LOYALTY_EXCHANGE',
            'PAYMENT_COMPLETED',
            'PAYMENT_FAILED',
            'TICKET_ISSUED',
            'LOG_BOOKING_COMPLETED'
        ]);
        
        return SagaManager;
    } catch (error) {
        console.error('❌ Failed to initialize Saga Orchestration:', error);
        throw error;
    }
};

export default initSagaOrchestration;
