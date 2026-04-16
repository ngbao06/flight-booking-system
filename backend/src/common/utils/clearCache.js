import redisClient from "../../config/redis.config.js";

// xoa cache khi POST, PATCH, DELETE
const clearListCache = async (moduleName, id) => {
    try {
        // Tìm tất cả các key liên quan đến module (bao gồm list và detail)
        const keys = await redisClient.keys(`${moduleName}:*`);
        
        // CHỈ XÓA KHI CÓ KEY TỒN TẠI
        if (keys && keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🧹 Đã xóa ${keys.length} cache keys của module: ${moduleName}`);
        }
    } catch (error) {
        console.error("❌ Lỗi khi xóa cache:", error);
    }
}

export default clearListCache;