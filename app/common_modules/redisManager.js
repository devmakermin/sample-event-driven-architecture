const redis = require('redis');
const genericPool = require('generic-pool');

// Redis 마스터 & 슬레이브 서버 정보
const redisConfig = {
    master: {
        host: CONFIG.REDIS_STORE_URL,
        port: CONFIG.REDIS_STORE_PORT
    },  // 마스터 (쓰기)
    slaves: [
        {
            host: CONFIG.REDIS_STORE_SLAVE1_URL,
            port: CONFIG.REDIS_STORE_PORT
        },
        {
            host: CONFIG.REDIS_STORE_SLAVE2_URL,
            port: CONFIG.REDIS_STORE_PORT
        }
    ]
};

// 마스터(쓰기) 전용 Redis 클라이언트 풀 생성
const masterPool = genericPool.createPool({
    create: async () => {
        const client = redis.createClient({
            socket: redisConfig.master,
            password: CONFIG.REDIS_AUTH,
            database: CONFIG.REDIS_STORE_DB_NO,
        });
        await client.connect();
        return client;
    },
    destroy: async (client) => await client.quit(),
}, { min: 2, max: 10 });

// 슬레이브(읽기) 전용 Redis 클라이언트 풀 생성
const slavePool = genericPool.createPool({
    create: async () => {
        const slave = redisConfig.slaves[Math.floor(Math.random() * redisConfig.slaves.length)];
        const client = redis.createClient({
            socket: slave,
            // password: CONFIG.REDIS_AUTH
            database: CONFIG.REDIS_STORE_DB_NO,
        });
        await client.connect();
        return client;
    },
    destroy: async (client) => await client.quit(),
}, { min: 2, max: 10 });

async function initPool(pool, minConnections) {
    const initPromises = [];
    for (let i = 0; i < minConnections; i++) {
        initPromises.push(pool.acquire().then(client => pool.release(client)));
    }
    await Promise.all(initPromises);
}

async function initRedisConnect() {
    logger.debug("Init Redis connect pools...");
    await initPool(masterPool, 2);
    await initPool(slavePool, 2);
    logger.debug("Init Redis connect pools Ready");
}

// key 조회
async function redisKeys(keyword) {
    const redisClient = await slavePool.acquire();
    try {
        let res = await redisClient.keys(keyword + "*");
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
};

// key 삭제
async function redisKeyDel(key) {
    const redisClient = await masterPool.acquire();
    try {
        let res = await redisClient.del(key)
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
};


// list value 개수
async function redisListLen(key) {
    const redisClient = await slavePool.acquire();
    try {
        let res = await redisClient.lLen(key);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
}

// list 범위 조회
async function redisListRange(key, start, end) {
    const redisClient = await slavePool.acquire();
    try {
        let res = await redisClient.lRange(key, start, end);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
}

// list push
async function redisListPush(key, value) {
    const redisClient = await masterPool.acquire();
    try {
        let result = await redisClient.lPush(key, value);
        return result;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}

// list index 조회
async function redisListRangeAll(key) {
    const redisClient = await slavePool.acquire();
    try {
        let result = await redisClient.lRange(key, 0, -1);
        return result;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
}

// hset
async function redisHset(key, field, value) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.HSET(key, field, value);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}

// hset
async function redisHsetMap(key, item) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.HSET(key, item);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}

// hgetAll
async function redisHgetAll(key) {
    const redisClient = await slavePool.acquire();
    try {
        let res = redisClient.HGETALL(key);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
}

// hDel
async function redisHdel(key, field) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.HDEL(key, field);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}

// set
async function redisSet(key, value) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.SET(key, value);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}

async function redisGet(key) {
    const redisClient = await slavePool.acquire();
    try {
        let res = redisClient.GET(key);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
}

async function redisSetExpire(key, value, expire_time) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.SET(key, value);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        redisClient.PEXPIREAT(key, expire_time);
        masterPool.release(redisClient);
    }
}

async function redisPexpireat(key, time) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.PEXPIREAT(key, time);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}

async function redisTtl(key) {
    const redisClient = await slavePool.acquire();
    try {
        let res = await redisClient.ttl(key);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        slavePool.release(redisClient);
    }
}

async function redisExpireat(key, time) {
    const redisClient = await masterPool.acquire();
    try {
        let res = redisClient.EXPIREAT(key, time);
        return res;
    } catch (err) {
        logger.error(err);
        throw err;
    } finally {
        masterPool.release(redisClient);
    }
}



module.exports = {
    initRedisConnect,
    redisKeys,
    redisKeyDel,
    redisListLen,
    redisListRange,
    redisListPush,
    redisListRangeAll,
    redisHset,
    redisHsetMap,
    redisHgetAll,
    redisHdel,
    redisSet,
    redisGet,
    redisSetExpire,
    redisPexpireat,
    redisTtl,
    redisExpireat,
};