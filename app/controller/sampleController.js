const sampleCall = async (request, response) => {
    let param = request.body;
    let pathname = request.originalUrl;
    let returns = {};
    try {

        let mysqlResult = await daoManager.mysqlSampleDao.findUserById(param.user_id);
        let mongoResult = await daoManager.mongoSampleDao.insertNegativeDB(mysqlResult);
        let oracleResult = await daoManager.oracleSampleDao.getSampleData();
        returns.data = mysqlResult;

        returns.code = RESPONSE_TYPE.SUCCESS;
        returns.msg = "";
        return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA, response, returns);


    } catch (e) {
        logger.error("ERROR sample Call " + e);

        returns.code = RESPONSE_TYPE.REQUEST_ERROR;
        returns.msg = "내부 오류가 발생하였습니다.";
        returns.data = [];

        return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA_ERROR, response, returns);
    }
}

module.exports = {
    sampleCall,
}