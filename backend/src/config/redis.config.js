import redis from 'redis'

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

let redisConnectPromise;

export const connectRedis = async () => {
    if (redisClient.isOpen) {
        return redisClient;
    }

    if (!redisConnectPromise) {
        redisConnectPromise = redisClient.connect().then(() => {
            console.log('Connected to Redis');
            return redisClient;
        });
    }

    return redisConnectPromise;
};

export default redisClient;