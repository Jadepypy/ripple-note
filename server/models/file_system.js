const { pool } = require('./mysql')

const DATA_TYPE = {
                    VAULT: '-1',
                    FOLDER: '0',
                    FILE: '1'
                  }

const getFileSystem = async (vaultID) => {
  const conn = await pool.getConnection()
  try{
    const [firstChild] = await conn.query('SELECT first_child_id from vaults where id = ?', [vaultID])
    const [files] = await conn.query('SELECT id, name, type, first_child_id, next_id from folder_file where vault_id = ?', [vaultID])
    return [firstChild, files]
  } catch(e) {
    console.log(e)
  } finally{
    await conn.release()
  }
}

const getFile = async (fileID) => {
  try{
    const [file] = await pool.query('SELECT text, revision_id FROM files WHERE id = ?', [fileID])
    console.log('file', file)
    return file[0]
  } catch(e) {
    console.log(e)
  }
}

const insertFileAfter = async (newFile, prevID, type) => {
  const conn = await pool.getConnection()
  try{
    conn.query('START TRANSACTION')
    const [result] = await conn.query('INSERT INTO folder_file SET ?', newFile)
    if(type == DATA_TYPE.FILE){
      await conn.query('INSERT INTO files (id, revision_id, text) VALUES (?, ?, ?)', [result.insertId, 0, ""])
    }
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

const insertFileUnderRoot = async (newFile, vaultID, type) => {
  const conn = await pool.getConnection()
  try{
    conn.query('START TRANSACTION')
    const [result] = await conn.query('INSERT INTO folder_file SET ?', newFile)
    if(type == DATA_TYPE.FILE){
      await conn.query('INSERT INTO files (id, revision_id, text) VALUES (?, ?, ?)', [result.insertId, 0, ""])
    }
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
    await pool.query('UPDATE folder_file SET name = ? WHERE id = ?', [name, fileID])
  } catch(e) {
    console.log(e)
  } 
}
const moveFile = async(dataArr, vaultID) => {
  const conn = await pool.getConnection()
  try{
    await conn.query('START TRANSACTION')
    let sql, bind
    for( const data of dataArr){
      if (data.id){
        console.log('data', data)
        sql = `UPDATE folder_file SET ${data.prop} = ? WHERE id = ?`
        bind = [data.change_to, data.id]
      } else{
        console.log('vault', data)
        sql = `UPDATE vaults SET ${data.prop} = ? WHERE id = ?`
        bind = [data.change_to, vaultID]
      }
      await conn.query(sql, bind)
    }
    await conn.query('COMMIT')
  } catch(e) {
    console.log(e)
    conn.query('ROLLBACK')
  } finally{
    await conn.release()
  }

}

const removeFile = async () => {

}

const removeFolder = async () => {

}

module.exports = {  DATA_TYPE,
                    getFileSystem,
                    getFile,
                    moveFile,
                    changeFileName,
                    insertFileAfter,
                    insertFileUnderRoot
}


