const { Kafka } = require("kafkajs");
const kafkaProducer= require("../common_modules/kafkaProducer");

let runningConsumer = null;


// body 예시:
// {
//   "topic": "sampleTopic",
//   "keyField": "user_id",   
//   "data": { "user_id": 1, "msg": "hello" }
//   "dataList": [ {...}, {...} ]
// }
const kafkaProduceSample = async (request, response) => {
    let param = request.body;
    let pathname = request.originalUrl;

    let returns = {
        code: RESPONSE_TYPE.SUCCESS,
        msg: "OK",
        data: [],
    };

    try {
        let topic = param.topic;
        if(topic == null || topic == "" || typeof topic == "undefined") {
            topic = global.CONFIG.KAFKA_TOPIC;
        }

        let keyField = param.keyField;

        let dataList = Array.isArray(param.dataList)
            ? param.dataList
            : (param.data ? [param.data] : []);

        if (dataList.length === 0) {
            returns.code = RESPONSE_FLAG_TYPE.PARAM_ERROR;
            returns.msg = "data 또는 dataList가 필요합니다.";
            return fnRes.resEnd(pathname, returns.code, response, returns);
        }

        await kafkaProducer.initKafkaProducer();
        await kafkaProducer.sendKafkaMessage(topic, dataList, keyField);

        returns.data = { 
            topic : topic, 
            sentCount: dataList.length 
        };
        return fnRes.resEnd(pathname, RESPONSE_TYPE.ASYNC_JSON_DATA, response, returns);
    } catch (e) {
        logger.error("ERROR kafkaProduceSample", e);

        returns.code = RESPONSE_TYPE.SYSTEM_ERROR;
        returns.msg = "Kafka 발행 중 오류가 발생하였습니다.";
        returns.data = [];

        return fnRes.resEnd(pathname, RESPONSE_TYPE.ASYNC_JSON_DATA_ERROR, response, returns);
    }
};

const kafkaConsumerStart = async (request, response) => {
    let param = request.body;
    let pathname = request.originalUrl;

    let returns = {
        code: RESPONSE_TYPE.SUCCESS,
        msg: "OK",
        data: [],
    };

    try {
        if (runningConsumer) {
            returns.data = { 
                status: "already_running" 
            };
            return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA, response, returns);
        }

        let topic = param.topic;

        if(topic == null || topic == "" || typeof topic == "undefined") {
            topic = global.CONFIG.KAFKA_TOPIC;
        }

        let groupId = param.groupId;
        if(groupId == null || groupId == "" || typeof groupId == "undefined") {
            groupId = global.CONFIG.KAFKA_GROUP_ID;
        }

        let clientId = process.env.POD_NAME;

        let brokers = global.CONFIG.KAFKA_BROKERS;
        let kafka = new Kafka({ clientId, brokers });
        let consumer = kafka.consumer({
            groupId,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            maxBytesPerPartition: 1048576,
        });

        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic: t, partition, message }) => {
                try {
                    let value = message.value ? message.value.toString() : "";
                    if (!value) {
                        logger.warn("Empty message value, skip");
                        return;
                    }

                    let parsed;
                    try {
                        parsed = JSON.parse(value);
                    } catch {
                        parsed = { 
                            raw: value 
                        };
                    }
                    logger.info(`[Kafka] topic=${t} partition=${partition} offset=${message.offset}`);
                    logger.info(`[Kafka] payload=${JSON.stringify(parsed)}`);

                } catch (err) {
                    logger.error("Error while processing kafka message", err);
                }
            },
        });

        runningConsumer = consumer;

        returns.data = { 
            status: "started", 
            topic : topic, 
            groupId : groupId, 
            brokers : brokers
         };
        return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA, response, returns);
    } catch (e) {
        logger.error("ERROR kafkaConsumerStart", e);

        returns.code = RESPONSE_TYPE.SYSTEM_ERROR;
        returns.msg = "Kafka 컨슈머 시작 중 오류가 발생하였습니다.";
        returns.data = [];

        return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA_ERROR, response, returns);
    }
};

const kafkaConsumerStop = async (request, response) => {
    let pathname = request.originalUrl;

    let returns = {
        code: RESPONSE_TYPE.SUCCESS,
        msg: "OK",
        data: [],
    };

    try {
        if (runningConsumer == null) {
            returns.data = { 
                status: "not_running" 
            };
            return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA, response, returns);
        }

        await runningConsumer.disconnect();
        runningConsumer = null;

        returns.data = { 
            status: "stopped" 
        };
        return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA, response, returns);
    } catch (e) {
        logger.error("ERROR kafkaConsumerStop", e);

        returns.code = RESPONSE_TYPE.SYSTEM_ERROR;
        returns.msg = "Kafka 컨슈머 종료 중 오류가 발생하였습니다.";
        returns.data = [];

        return fnRes.resEnd(pathname, RESPONSE_FLAG_TYPE.ASYNC_JSON_DATA_ERROR, response, returns);
    }
};

module.exports = {
    kafkaProduceSample,
    kafkaConsumerStart,
    kafkaConsumerStop,
};