-- name: user.findById
SELECT id, email, name
FROM users
WHERE id = ?;

-- name: user.create
INSERT INTO users (email, name)
VALUES (?, ?);

-- name: user.updateName
UPDATE users
SET name = ?
WHERE id = ?;