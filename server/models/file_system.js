const { pool } = require('./mysql')

const DATA_TYPE = {
                    VAULT: '-1',
                    FOLDER: '0',
                    FILE: '1'
                  }

const getFileSystem = async (vaultID) => {
  const conn = await pool.getConnection()
  try{
    const [vault] = await conn.query('SELECT first_child_id, revision_id from vaults where id = ?', [vaultID])
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
    if(file.length < 1){
      return {error: 'Database query error'}
    }
    return {file: file[0]}
  } catch(e) {
    console.log(e)
  }
}

const insertFileAfter = async (newFile, prevID, type, vaultID, revisionID) => {
  const conn = await pool.getConnection()
  try{
    conn.query('START TRANSACTION')
    const [vaults] = await conn.query(`SELECT revision_id FROM vaults WHERE id = ? FOR UPDATE`, [vaultID])
    const vault = vaults[0]
    if(revisionID < vault.revision_id){
      return {error: 'Invalid action'}
    } else{
      await conn.query(`UPDATE vaults SET revision_id = ? WHERE id= ?`, [++vault.revision_id, vaultID])
    }
    const [result] = await conn.query('INSERT INTO folder_file SET ?', newFile)
    if(type == DATA_TYPE.FILE){
      await conn.query('INSERT INTO files (id, revision_id, text) VALUES (?, ?, ?)', [result.insertId, 0, ""])
    }
    await conn.query('UPDATE folder_file SET next_id = ? WHERE id = ?', [result.insertId, prevID])
    await conn.query('COMMIT')
    return {id: result.insertId, revision_id: vault.revision_id}
  } catch(error) {
    console.log(error)
    conn.query('ROLLBACK')
    return {error}
  } finally{
    await conn.release()
  }
}

const insertFileUnder = async (newFile, parentID, type, vaultID, revisionID) => {
  const conn = await pool.getConnection()
  try{
    conn.query('START TRANSACTION')
    const [vaults] = await conn.query(`SELECT revision_id FROM vaults WHERE id = ? FOR UPDATE`, [vaultID])
    const vault = vaults[0]
    if(revisionID < vault.revision_id){
      return {error: 'Invalid action'}
    } else{
      await conn.query(`UPDATE vaults SET revision_id = ? WHERE id= ?`, [++vault.revision_id, vaultID])
    }
    const [result] = await conn.query('INSERT INTO folder_file SET ?', newFile)
    if(type == DATA_TYPE.FILE){
      await conn.query('INSERT INTO files (id, revision_id, text) VALUES (?, ?, ?)', [result.insertId, 0, ""])
    }
    await conn.query('UPDATE folder_file SET first_child_id = ? WHERE id = ?', [result.insertId, parentID])
    await conn.query('COMMIT')
    return {id: result.insertId, revision_id: vault.revision_id}
  } catch(error) {
    console.log(error)
    conn.query('ROLLBACK')
    return {error}
  }finally{
    await conn.release()
  }
}

const insertFileUnderRoot = async (newFile, vaultID, type, revisionID) => {
  const conn = await pool.getConnection()
  try{
    conn.query('START TRANSACTION')
    const [vaults] = await conn.query(`SELECT revision_id FROM vaults WHERE id = ? FOR UPDATE`, [vaultID])
    const vault = vaults[0]
    if(revisionID < vault.revision_id){
      return {error: 'Invalid action'}
    } else{
      await conn.query(`UPDATE vaults SET revision_id = ? WHERE id= ?`, [++vault.revision_id, vaultID])
    }
    const [result] = await conn.query('INSERT INTO folder_file SET ?', newFile)
    if(type == DATA_TYPE.FILE){
      await conn.query('INSERT INTO files (id, revision_id, text) VALUES (?, ?, ?)', [result.insertId, 0, ""])
    }
    await conn.query('UPDATE vaults SET first_child_id = ? WHERE id = ?', [result.insertId, vaultID])
    await conn.query('COMMIT')
    return {id: result.insertId, revision_id: vault.revision_id}
  } catch(error) {
    console.log(error)
    conn.query('ROLLBACK')
    return {error}
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

const moveFile = async(dataArr, vaultID, revisionID) => {
  const conn = await pool.getConnection()
  try{
    await conn.query('START TRANSACTION')
    let sql, bind
    for( const data of dataArr){
      if (data.id){
        //console.log('data', data)
        sql = `UPDATE folder_file SET ${data.prop} = ? WHERE id = ?`
        bind = [data.change_to, data.id]
      } else{
        //console.log('vault', data)
        sql = `UPDATE vaults SET ${data.prop} = ? WHERE id = ?`
        bind = [data.change_to, vaultID]
      }
      await conn.query(sql, bind)
    }
    await conn.query(`UPDATE vaults SET revision_id = ? WHERE id = ?`, [revisionID, vaultID])
    await conn.query('COMMIT')
    return {}
  } catch(error) {
    console.log(error)
    conn.query('ROLLBACK')
    return {error}
  } finally{
    await conn.release()
  }

}

const searchFileSystem = async (userID, vaultID, keyword) => {
  const conn = await pool.getConnection()
  try{
    let [users] = await conn.query(
        `SELECT vault_id FROM vault_user
        WHERE user_id = ? and vault_id = ?`, [userID, vaultID])
    if(users.length < 1){
      return {error: 'Permission Denied'}
    }
    const idSet = new Set()
    const [textResult] = await conn.query(`SELECT f.id as id FROM files f JOIN folder_file ff ON f.id = ff.id WHERE ff.vault_id = ? and lower(f.text) LIKE ?`,[vaultID, `%${keyword}%`])
    // const [nameResult] = await conn.query(`SELECT id FROM folder_file WHERE vault_id = ? and lower(name) LIKE ?`,[vaultID, `%${keyword}%`])
    return {ids: [textResult, []]}
  } catch(error) {
    await conn.query('ROLLBACK')
    conn.release()
    console.log(error)
    return {error}
  } finally{
    conn.release()
  }
}

const removeFiles = async (idArr, data, vaultID, revisionID) => {
  const conn = await pool.getConnection()
  try{
    await conn.query('START TRANSACTION')
    if (data.id){
      //console.log('data', data)
      sql = `UPDATE folder_file SET ${data.prop} = ? WHERE id = ?`
      bind = [data.change_to, data.id]
    } else{
      //console.log('vault', data)
      sql = `UPDATE vaults SET ${data.prop} = ? WHERE id = ?`
      bind = [data.change_to, vaultID]
    }
    await conn.query(sql, bind)
    await conn.query('DELETE FROM folder_file WHERE id IN (?)',[idArr])
    await conn.query('DELETE FROM files WHERE id IN (?)',[idArr])
    await conn.query(`UPDATE vaults SET revision_id = ? WHERE id = ?`, [revisionID, vaultID])
    await conn.query('COMMIT')
    return {}
  } catch(error) {
    console.log(error)
    conn.query('ROLLBACK')
    return {error}
  } finally{
    await conn.release()
  }
}

module.exports = {  DATA_TYPE,
                    getFileSystem,
                    searchFileSystem,
                    getFile,
                    moveFile,
                    changeFileName,
                    insertFileAfter,
                    insertFileUnderRoot,
                    insertFileUnder,
                    removeFiles
}


