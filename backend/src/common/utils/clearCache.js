import redisClient from "../../config/redis.config.js";

// xoa cache khi POST, PATCH, DELETE
const clearListCache = async (moduleName) => {
    const keys = await redisClient.keys(`${moduleName}:list:*`);
    await redisClient.del(keys);
}

export default clearListCache;