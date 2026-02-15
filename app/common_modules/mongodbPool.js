let mongoDbPool = {
    accountId: global.CONFIG.MONGO_DB_ACCOUNT,
    accountPwd: global.CONFIG.MONGO_DB_PASSWORD,
    url: global.CONFIG.MONGO_DB_URL,
    port: global.CONFIG.MONGO_DB_PORT,
    useDb: global.CONFIG.MONGO_DB_NAME,
    poolSize: 10,
}

let mongoDbSlave1Pool = {
    accountId: global.CONFIG.MONGO_DB_SLAVE1_ACCOUNT,
    accountPwd: global.CONFIG.MONGO_DB_SLAVE1_PASSWORD,
    url: global.CONFIG.MONGO_DB_SLAVE1_URL,
    port: global.CONFIG.MONGO_DB_SLAVE1_PORT,
    useDb: global.CONFIG.MONGO_DB_SLAVE1_NAME,
    poolSize: 10,
}

let mongoDbSlave2Pool = {
    accountId: global.CONFIG.MONGO_DB_SLAVE2_ACCOUNT,
    accountPwd: global.CONFIG.MONGO_DB_SLAVE2_PASSWORD,
    url: global.CONFIG.MONGO_DB_SLAVE2_URL,
    port: global.CONFIG.MONGO_DB_SLAVE2_PORT,
    useDb: global.CONFIG.MONGO_DB_SLAVE2_NAME,
    poolSize: 10,
}

global.NATIVE_DB_URL = "mongodb://" + mongoDbPool.accountId + ":" + mongoDbPool.accountPwd + "@" + mongoDbPool.url + ":" + mongoDbPool.port + "," +
    mongoDbSlave1Pool.url + ":" + mongoDbSlave1Pool.port + "," +
    mongoDbSlave2Pool.url + ":" + mongoDbSlave2Pool.port + "/?replicaSet=rs0&readPreference=secondaryPreferred";
