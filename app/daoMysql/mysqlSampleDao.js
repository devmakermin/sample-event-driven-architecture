const { queryRead, queryWrite, withMasterTransaction } = require("../common_modules/mysqlPool");

async function findUserById(id) {
    const rows = await queryRead(
        "SELECT id, email, name FROM users WHERE id = ?",
        [id]
    );
    return rows[0] || null;
}

async function createUser(email, name) {
    return queryWrite(
        "INSERT INTO users (email, name) VALUES (?, ?)",
        [email, name]
    );
}

async function updateUserName(id, name) {
    return queryWrite(
        "UPDATE users SET name = ? WHERE id = ?",
        [name, id]
    );
}


module.exports = {
    findUserById,
    createUser,
    updateUserName,
};
