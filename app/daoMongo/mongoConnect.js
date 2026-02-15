function MongoNativeConnect() {
    let { MongoClient } = require('mongodb');
    let url = NATIVE_DB_URL;
    let client = new MongoClient(url, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true
        readPreference: 'secondaryPreferred'
    });

    return client;
}

exports.MongoNativeConnect = MongoNativeConnect;