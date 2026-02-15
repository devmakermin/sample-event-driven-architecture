const sampleCtl = require('./controller/sampleController.js');
const kafkaCtl = require('./controller/kafkaController.js');

module.exports = (app) => {
    app.post('/sampleCall', sampleCtl.sampleCall);                

    // Kafka 샘플 라우트
    app.post("/kafka/produce", kafkaCtl.kafkaProduceSample);
    app.post("/kafka/consumer/start", kafkaCtl.kafkaConsumerStart);
    app.post("/kafka/consumer/stop", kafkaCtl.kafkaConsumerStop);
    return app;
}