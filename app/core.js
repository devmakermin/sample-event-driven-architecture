function serverStart(CONFIG) {
    let cluster = require("cluster");

    global.CONFIG = CONFIG;

    let numCPUs = require("os").cpus().length;
    let MAX_CORE = parseInt(CONFIG.MAX_CORE);
    numCPUs = Math.min(numCPUs, MAX_CORE);
    numCPUs = 1;

    let log4js = require("log4js");
    let standardLogger = log4js.getLogger("master");

    process.on("uncaughtException", function (err) {
        standardLogger.error("Caught exception : " + err);
        standardLogger.error(err.stack);
        console.log("Caught exception : " + err);
        console.log(err.stack);
    });

    if (CONFIG.CLUSTER == "cluster") {
        let logConfig = require("./logConfig_cluster_master.json");
        logConfig.appenders.master.filename = CONFIG.LOG_PATH + logConfig.appenders.master.filename + "_" + require("ip").address() + "_" + CONFIG.SERVER_HTTP_PORT;
        logConfig.categories.default.level = CONFIG.LOGGER_LEVEL;

        if (cluster.isMaster) {
            log4js.configure(logConfig);
            let logger = log4js.getLogger("master");

            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }

            cluster.on("online", function (worker) {
                logger.debug("Pid[" + worker.process.pid + "] Start");
            });

            cluster.on("exit", function (worker, code, signal) {
                logger.debug("worker pid: " + worker.process.pid + " /  worker_id: " + worker.id + " died");

                let n_worker = cluster.fork();
                logger.error("n_worker " + n_worker.process.pid + " born");
                logger.error("worker list " + cluster.workers);
                logger.error("worker first " + Object.keys(cluster.workers)[0]);
            });
        } else {
            if (typeof logConfig.appenders["worker_" + cluster.worker.id] == "undefined") {
                logConfig.appenders["worker_" + cluster.worker.id] = { type: "file", filename: logConfig.appenders.master.filename };
                logConfig.appenders["worker_console_" + cluster.worker.id] = { type: "console" };
                logConfig.categories.default.appenders.push("worker_" + cluster.worker.id);
                logConfig.categories.default.appenders.push("worker_console_" + cluster.worker.id);
                logConfig.categories.default.level = CONFIG.LOGGER_LEVEL;
            }

            log4js.configure(logConfig);
            let logger = log4js.getLogger("worker_" + cluster.worker.id);

            subThread(CONFIG, logger);
        }
    } else {
        let logConfig = require("./logConfig_single.json");
        logConfig.appenders.single_develop.filename = CONFIG.LOG_PATH + logConfig.appenders.single_develop.filename + "_" + require("ip").address() + "_" + CONFIG.SERVER_HTTP_PORT;
        logConfig.categories.default.level = CONFIG.LOGGER_LEVEL;

        log4js.configure(logConfig);
        let logger = log4js.getLogger("single_develop");

        subThread(CONFIG, logger);
    }
}

function subThread(CONFIG, logger) {
    process.on("uncaughtException", function (err) {
        logger.fatal("Caught exception : " + err);
        logger.fatal(err.stack);
        console.log("Caught exception : " + err);
        console.log(err.stack);
    });

    global.CONFIG = CONFIG;
    global.logger = logger;
    global.async = require("async");
    global.httpApiRequest = require("request");
    require("date-utils");
    global.fs = require("fs");
    global.md5 = require("md5");

    global.defineSet = require("./common_modules/defineSet");
    global.daoManager = require("./common_modules/daoManager");
    global.mongodbPool = require("./common_modules/mongodbPool.js");
    global.fnRes = require("./common_modules/fnResponse");
    global.dateModule = require("./common_modules/dateModule");
    global.redisManager = require("./common_modules/redisManager.js");
    global.oracleManager = require("./common_modules/oracleManager.js");
    global.requestCall = require("./common_modules/requestCall");
    global.commons = require("./common_modules/commons");

    serverInit();
    
}

async function serverInit() {
    let path = require("path");
    let { initSqlRegistry } = require("./common_modules/sqlRegistry");
    initSqlRegistry(path.join(__dirname, "mapper"));

    const { initMySql } = require("./common_modules/mysqlPool");
    await initMySql();

    await oracleManager.oraclePoolInit();

    await redisManager.initRedisConnect();

    require('./app.js')(CONFIG.SERVER_HTTP_PORT);
}

exports.serverStart = serverStart;
