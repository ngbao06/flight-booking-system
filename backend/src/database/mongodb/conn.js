import mongoose from 'mongoose';
import configMongo from './../../config/mongo.config.js';

let isConnected = false;

export const connectMongo = async () => {
    if (isConnected) return mongoose.connection;

    const connection = await configMongo; 
    isConnected = connection.readyState === 1;

    return connection;
};

export const getMongo = () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB chưa được kết nối');
    }
    return mongoose.connection;
};

export default {
    connectMongo,
    getMongo
};