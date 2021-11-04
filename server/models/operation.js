const { pool } = require('./mysql')

const createOperation = async (fileID, revisionID, doc, operation) => {
  const conn = await pool.getConnection()
  try {
    await conn.query('INSERT INTO files ( id, revision_id, text) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE revision_id = ?, text = ?', [fileID, revisionID, doc, revisionID, doc])
    await conn.query('INSERT INTO operation (revision_id, user_id, file_id, type, position, count, `key`, time) VALUES ?', [operation])
    conn.query('COMMIT')
  } catch (e) {
    console.log(e)
    conn.query('ROLLBACK')
  } finally {
    conn.release()
  }
}
//type, position, count, key
module.exports = { createOperation}