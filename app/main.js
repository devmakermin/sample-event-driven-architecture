let pathManager = require('path');
let propertiesReader = require('properties-reader');
let fileName = 'SampleServer.properties';

require('dotenv').config();
const filePath = pathManager.join(__dirname, '../properties', fileName);
const properties = propertiesReader(filePath);
const MODE = properties.get("MODE");
const CONFIG = properties.path()[MODE];

let CLUSTER = properties.get("CLUSTER");
let MAX_CORE = properties.get("MAX_CORE");
let MONGO_SESSION_TIME = properties.get("MONGO_SESSION_TIME");

global.MODE = MODE;
global.MAX_CORE = MAX_CORE;
global.MONGO_SESSION_TIME = MONGO_SESSION_TIME;
CONFIG.CLUSTER = CLUSTER;

require('./core').serverStart(CONFIG);
