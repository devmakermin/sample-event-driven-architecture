const express = require('express');
const pathHandler = require('./pathHandler.js');
const { closeMySql } = require("./common_modules/mysqlPool");

let router = express.Router();
const BASE_URL = "/sample";

module.exports = (port) => {
    let app = express();
    app.use(express.json());

    // allow header
    
    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'POST');
        res.header('Access-Control-Allow-Headers', 'content-type, x-access-token');

        next();
    });

    app.get('/healthz', (req, res) => {
        if (isShuttingDown) {
            return res.status(503).send('Shutting down');
        }

        res.status(200).send('OK');
    });

    router.use('/', (req, res, next) => {
        if (typeof req.body === "undefined" || req.body === null) {
            console.log(`req.body is ${typeof req.body}, ${req.body}`);

            return res.send({
                code: RESPONSE_TYPE.PARAM_ERROR,
                msg: "ERROR Sample Server NOT FOUND PARAM"
            });
        }
        
        next();
    });

    // setting router
    router = pathHandler(router);

    app.use(BASE_URL, router);

    // 서버 시작 및 port 세팅
    const server = app.listen(port, async () => {
        console.log(`Server is running on http://localhost:${port}${BASE_URL}`);
    })

    let connections = new Set();
    let isShuttingDown = false;
    let shutdownOnce = false;

    server.on('connection', (conn) => {
        connections.add(conn);
        conn.on('close', () => {
            connections.delete(conn);
        });
    });

    // SIGTERM graceful shutdown
    async function shutdown(signal) {
        if (shutdownOnce) {
            return;
        }
        shutdownOnce = true;
        isShuttingDown = true;

        console.log('Received SIGTERM, stopping accepting new connections');

        // 60초 후 강제 종료(보험)
        const forceTimer = setTimeout(() => {
            console.log("Forcefully closing remaining connections");
            connections.forEach((c) => c.destroy());
            process.exit(1);
        }, 60 * 1000);

        // 새 요청 차단
        server.close(async () => {
            console.log("HTTP server closed");

            try {
                await closeMySql();
                console.log("MySQL pool closed");
            } catch (err) {
                console.error("MySQL close error:", err && err.message ? err.message : err);
            }

            // keep-alive 커넥션 정리 유예(선택)
            setTimeout(() => {
                clearTimeout(forceTimer);
                console.log("Shutdown complete");
                process.exit(0);
            }, 10 * 1000);
        });
    }

    app.all('*', (req, res) => {
        logger.debug("==========")
        res.status(404).send({
            message: "404 Not found"
        });
    });

    process.on("SIGINT", () => shutdown("SIGINT"));

    // kill / PM2 stop / k8s termination
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    
    return app
}