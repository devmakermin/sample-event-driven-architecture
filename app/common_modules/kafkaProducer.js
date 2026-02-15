const { Kafka } = require('kafkajs');

let producer;  // 싱글톤처럼 재사용

async function initKafkaProducer() {
    if (producer) {
        return producer;
    }

    const podName = process.env.POD_NAME;
    const podUid = process.env.POD_UID;

    const kafka = new Kafka({
        clientId: podName,
        brokers: global.CONFIG.KAFKA_BROKERS,
    });

    producer = kafka.producer();

    await producer.connect();
    console.log('[Kafka] Producer connected');

    // 종료 처리
    const shutdown = async () => {
        try {
            console.log('[Kafka] Producer disconnecting...');
            await producer.disconnect();
        } catch (err) {
            console.error('[Kafka] Producer disconnect error:', err);
        } finally {
            process.exit(0);
        }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return producer;
}

async function sendKafkaMessage(topic, dataList, keyField = null) {
    if (!producer) {
        await initKafkaProducer();
    }

    try {
        let maxCount = 200;
        let maxBytes = 1024 * 1024;
        let batch = [];
        let bytes = 0;

        const flush = async () => {
            if(batch.length === 0) {
                return;
            }
            await producer.send({
                topic,
                messages: batch,
            });
            batch = [];
            bytes = 0;

        }

        for (let i = 0; i < dataList.length; i++) {
            let item  = dataList[i];
            let value = JSON.stringify(item);
            let msg = {
                key: keyField ? String(item[keyField]) : undefined,
                value: value,
            }

            let msgBytes = byteLength(value);

            if(msgBytes > maxBytes) {
                await flush();
                await producer.send({topic, messages: [msg]});

                continue;
            }

            if(batch.length + 1 > maxCount || bytes + msgBytes > maxBytes) {
                await flush();
            }

            batch.push(msg);
            bytes += msgBytes;
        }

        await flush();

        console.log(`[Kafka] Batch sent (${dataList.length}) messages`);
    } catch(err) {
        console.error('[Kafka] sendKafkaMessages error', err);
        throw err;
    }
}

function byteLength(str) {
    return Buffer.byteLength(str, "utf8");
}

module.exports = {
    initKafkaProducer,
    sendKafkaMessage
}