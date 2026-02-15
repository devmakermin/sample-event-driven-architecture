const fs = require("fs");
const path = require("path");

function parseSqlFile(content, filenameForError) {
    const lines = content.split(/\r?\n/);

    const queries = {};
    let currentName = null;
    let buffer = [];

    function flush() {
        if (!currentName) {
            return;
        }

        const sql = buffer.join("\n").trim();

        if (!sql) {
            throw new Error(`Empty SQL for name: ${currentName} in ${filenameForError}`);
        }

        if (queries[currentName]) {
            throw new Error(`Duplicate SQL name: ${currentName} in ${filenameForError}`);
        }

        queries[currentName] = sql;
        currentName = null;
        buffer = [];
    }

    for (const line of lines) {
        const m = line.match(/^\s*--\s*name:\s*([A-Za-z0-9_.-]+)\s*$/);

        if (m) {
            flush();
            currentName = m[1];
            continue;
        }

        if (currentName) {
            buffer.push(line);
        }
    }

    flush();
    return queries;
}

function loadSqlDirectory(sqlDir) {
    const absDir = path.resolve(sqlDir);

    if (!fs.existsSync(absDir)) {
        throw new Error(`SQL directory not found: ${absDir}`);
    }

    const files = fs.readdirSync(absDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    const registry = {};

    for (const file of files) {
        const full = path.join(absDir, file);
        const content = fs.readFileSync(full, "utf8");
        const parsed = parseSqlFile(content, full);

        for (const [k, v] of Object.entries(parsed)) {
            if (registry[k]) {
                throw new Error(`Duplicate SQL name across files: ${k} (at ${full})`);
            }
            registry[k] = v;
        }
    }

    return registry;
}

let _registry = null;

function initSqlRegistry(sqlDir) {
    _registry = loadSqlDirectory(sqlDir);
    return _registry;
}

function getSql(name) {
    if (!_registry) {
        throw new Error("SQL registry is not initialized. Call initSqlRegistry() first.");
    }

    const sql = _registry[name];
    if (!sql) {
        throw new Error(`SQL not found: ${name}`);
    }

    return sql;
}

module.exports = {
    initSqlRegistry,
    getSql,
};
