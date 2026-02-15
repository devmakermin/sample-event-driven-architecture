const mysql = require("mysql2/promise");

const baseOptions = {
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    charset: "utf8mb4",
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

const mode = (CONFIG.DB_MODE || "single").toLowerCase();

let singlePool = null;
let replCluster = null;

function createSinglePool() {
    singlePool = mysql.createPool({
        ...baseOptions,
        host: CONFIG.MYSQL_DB_URL,
        port: Number(CONFIG.MYSQL_DB_PORT || 3306),
        user: CONFIG.MYSQL_DB_ACCOUNT,
        password: CONFIG.MYSQL_DB_PASSWORD,
        database: CONFIG.MYSQL_DB_NAME,
    });
}

function createReplicationCluster() {
    replCluster = mysql.createPoolCluster({
        canRetry: true,
        removeNodeErrorCount: 5,
        restoreNodeTimeout: 10000,
    });

    replCluster.add("MASTER", {
        ...baseOptions,
        host: CONFIG.MASTER_MYSQL_DB_URL,
        port: Number(CONFIG.MASTER_MYSQL_DB_PORT || 3306),
        user: CONFIG.MASTER_MYSQL_DB_ACCOUNT,
        password: CONFIG.MASTER_MYSQL_DB_PASSWORD,
        database: CONFIG.MASTER_MYSQL_DB_NAME,
    });

    replCluster.add("SLAVE1", {
        ...baseOptions,
        host: CONFIG.SLAVE_MYSQL_DB_URL,
        port: Number(CONFIG.SLAVE_MYSQL_DB_PORT || 3306),
        user: CONFIG.SLAVE_MYSQL_DB_ACCOUNT,
        password: CONFIG.SLAVE_MYSQL_DB_PASSWORD,
        database: CONFIG.SLAVE_MYSQL_DB_NAME,
    });
}

async function initMySql() {
    if (replCluster || singlePool) {
        return;
    }

    if (mode === "replication") {
        createReplicationCluster();
        console.log("[DB] mode=replication");

        // MASTER ping
        {
            const pool = replCluster.of("MASTER", "ORDER");
            const conn = await pool.getConnection();
            try {
                await conn.ping();
                console.log("[DB] MASTER ping ok");
            } finally {
                conn.release();
            }
        }

        // SLAVE ping (슬레이브가 1대 이상이면 기본은 SLAVE* 중 하나)
        {
            const pool = replCluster.of("SLAVE*", "RR");
            const conn = await pool.getConnection();
            try {
                await conn.ping();
                console.log("[DB] SLAVE ping ok");
            } finally {
                conn.release();
            }
        }

        return;
    } else {
        createSinglePool();
        console.log("[DB] mode=single");

        const conn = await singlePool.getConnection();
        try {
            await conn.ping();
            console.log("[DB] single ping ok");
        } finally {
            conn.release();
        }
    }
}


 // 읽기 쿼리 (슬레이브)
async function queryRead(sql, params = []) {
    if (replCluster) {
        const pool = replCluster.of("SLAVE*", "RR");
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    const [rows] = await singlePool.query(sql, params);
    return rows;
}


 // 마스터 읽기
async function queryReadStrong(sql, params = []) {
    if (replCluster) {
        const pool = replCluster.of("MASTER", "ORDER");
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    const [rows] = await singlePool.query(sql, params);
    return rows;
}

// 쓰기 쿼리(슬레이브)
async function queryWrite(sql, params = []) {
    if (replCluster) {
        const pool = replCluster.of("MASTER", "ORDER");
        const [result] = await pool.execute(sql, params);
        return {
            affectedRows: result.affectedRows || 0,
            insertId: result.insertId || 0,
        };
    }

    const [result] = await singlePool.execute(sql, params);
    return {
        affectedRows: result.affectedRows || 0,
        insertId: result.insertId || 0,
    };
}

// 트랜잭션 처리(마스터)
async function withTransaction(fn) {
    let conn;

    if (replCluster) {
        const pool = replCluster.of("MASTER", "ORDER");
        conn = await pool.getConnection();
    } else {
        conn = await singlePool.getConnection();
    }

    try {
        await conn.beginTransaction();
        const out = await fn(conn);
        await conn.commit();
        return out;
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) {}
        throw err;
    } finally {
        conn.release();
    }
}

// 서버 종료 시 풀 정리
async function closeMySql() {
    if (singlePool) {
        await singlePool.end();
        singlePool = null;
    }

    replCluster = null;
}


module.exports = {
    initMySql,
    closeMySql,
    queryRead,
    queryReadStrong,
    queryWrite,
    withTransaction,
};
