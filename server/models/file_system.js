const { pool } = require('./mysql')

const DATA_TYPE = {
                    VAULT: '-1',
                    FOLDER: '0',
                    FILE: '1'
                  }

const getFileSystem = async (vaultID) => {
  const conn = await pool.getConnection()
  try{
    const [vault] = await conn.query('SELECT first_child_id from vaults where id = ?', [vaultID])
    const [files] = await conn.query('SELECT id, name, type, first_child_id, next_id from folder_file where vault_id = ?', [vaultID])
    return [vault, files]
  } catch(e) {
    console.log(e)
  } finally{
    await conn.release()
  }
}


const getFile = async (fileID) => {
  try{
    const [file] = await pool.query('SELECT text, revision_id FROM files WHERE id = ?', [fileID])
    return file
  } catch(e) {
    console.log(e)
  }
}

const insertFileAfter = async (newFile, prevID) => {
  const conn = await pool.getConnection()
  console.log(newFile, prevID)
  try{
    conn.query('START TRANSACTION')
    const [result] = await conn.query('INSERT INTO folder_file SET?', newFile)
    console.log(result)
    await conn.query('UPDATE folder_file SET next_id = ? WHERE id = ?', [result.insertId, prevID])
    await conn.query('COMMIT')
    return result.insertId
  } catch(e) {
    console.log(e)
    conn.query('ROLLBACK')
  } finally{
    await conn.release()
  }
}

const insertFileUnderRoot = async (newFile, vaultID) => {
  const conn = await pool.getConnection()
  try{
    conn.query('START TRANSACTION')
    const [result] = await conn.query('INSERT INTO folder_file SET?', newFile)
    await conn.query('UPDATE vaults SET first_child_id = ? WHERE id = ?', [result.insertId, vaultID])
    await conn.query('COMMIT')
    return result.insertId
  } catch(e) {
    console.log(e)
    conn.query('ROLLBACK')
  } finally{
    await conn.release()
  }
}

const changeFileName = async (fileID, name) => {
  try{
    console.log(fileID, name)
    await pool.query('UPDATE folder_file SET name = ? WHERE id = ?', [name, fileID])
  } catch(e) {
    console.log(e)
  } 
}

const removeFile = async () => {

}

const removeFolder = async () => {

}

module.exports = {  DATA_TYPE,
                    getFileSystem,
                    getFile,
                    changeFileName,
                    insertFileAfter,
                    insertFileUnderRoot
}


