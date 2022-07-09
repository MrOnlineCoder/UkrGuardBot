import Redis from 'ioredis'
import logger from './logger';
let client: Redis;

export async function initRedis() {
    client = new Redis({
        lazyConnect: true
    });

    await client.connect();

    logger.log(`Redis`, `Connected to Redis.`);
}

export function getRedisClient() {
    return client;
}