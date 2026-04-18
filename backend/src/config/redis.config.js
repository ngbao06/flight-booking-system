import redis from 'redis'

const redisClient = redis.createClient({
    url: `redis://localhost:${process.env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('Connected to Redis');
})();

export default redisClient;