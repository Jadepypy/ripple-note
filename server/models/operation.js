const { pool } = require('./mysql')

const createOperation = async (fileID, revisionID, doc, updatedAt) => {
  try {
    await pool.query('INSERT INTO files ( file_id, revision_id, text, updated_at) VALUES (?, ?, ?, ?)', [fileID, revisionID, doc, updatedAt])
  } catch (e) {
    console.log(e)
  }
}

const updateOperation = async (fileID, revisionID, doc, updatedAt, recordID) => {
  try {
    const result = await pool.query('UPDATE files SET revision_id = ?, text = ?, updated_at = ? WHERE id = ?', [ revisionID, doc, updatedAt, recordID])
  } catch (e) {
    console.log(e)
  }
}
//type, position, count, key
module.exports = { createOperation, updateOperation}