let oracledb = require('oracledb');

let oracleDbPool = {
    accountId: global.CONFIG.ORACLE_DB_ACCOUNT,
    accountPwd: global.CONFIG.ORACLE_DB_PASSWORD,
    url: global.CONFIG.ORACLE_DB_URL,
    port: global.CONFIG.ORACLE_DB_PORT,
    useDb: global.CONFIG.ORACLE_DB_NAME,
}

async function oraclePoolInit() {
    try {
        await oracledb.createPool({
            user: oracleDbPool.accountId,
            password: oracleDbPool.accountPwd,
            connectString: oracleDbPool.url + ":" + oracleDbPool.port + "/" + oracleDbPool.useDb
        });
        logger.debug("connection pool started");
    } catch (err) {
        logger.error('init() error : ' + err.message);
        await closePoolAndExit();
    } finally {
        logger.debug("connection oracle db");
    }
}

function closePoolAndExit() {
    try {
        oracledb.getPool().close(10);
        logger.error('Pool closed');
    } catch (err) {
        logger.error('\n Terminating');
        logger.error(err.message);
    }
}

async function executeQuery(packageName, mapping, params, callback) {
    let oracleDbConnection = null;
    let fetchData = [];
    let outCode = null;
    let outMsg = null;
    let errorMessgae = null;
    let resultData = {};
    try {
        logger.debug("pkg name : " + packageName);
        oracleDbConnection = await oracledb.getConnection();
        let result = await oracleDbConnection.execute("CALL " + packageName + mapping, params, { autoCommit: true });

        outCode = (result.outBinds.out_code).trim();
        outMsg = result.outBinds.out_msg;

        for (let key in params) {
            if (key == "fetch_data") {
                continue;
            }
            resultData[key] = result.outBinds[key];
        }

        if (outCode == "00") {
            if (typeof result.outBinds.fetch_data != "undefined") {
                let resultSet = result.outBinds.fetch_data;
                let keys = resultSet.metaData;

                let rows = await resultSet.getRows();
                if (rows.length > 0) {
                    for (let i = 0; i < rows.length; i++) {
                        let info = rows[i];
                        let obj = {};
                        for (let j = 0; j < keys.length; j++) {
                            obj[keys[j]["name"]] = info[j]
                        }
                        fetchData.push(obj);
                    }
                }
                await resultSet.close();
            }
        }
        resultData.data = fetchData;
    } catch (err) {
        logger.error(err);
        errorMessgae = err;
    } finally {
        if (oracleDbConnection) {
            await oracleDbConnection.close();
            if (errorMessgae != null) {
                callback(errorMessgae, null);
            } else {
                if (outCode != "00") {
                    logger.error(outMsg);
                    callback(null, resultData);
                } else {
                    callback(null, resultData);
                }
            }
        } else {
            if (errorMessgae != null) {
                logger.error(errorMessgae);
                logger.error(errorMessgae.errorNum);
                callback(errorMessgae, null);
            } else {
                if (outCode != "00") {
                    logger.error(outMsg);
                    callback(null, resultData);
                } else {
                    callback(null, resultData);
                }
            }
        }
    }
}

module.exports = {
    oraclePoolInit,
    closePoolAndExit,
    executeQuery
};