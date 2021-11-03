const { pool } = require('./mysql')

const DATA_TYPE = {
                    VAULT: '-1',
                    FOLDER: '0',
                    FILE: '1'
                  }

const getFileSystem = async (vaultID) => {
  try{
    const conn = await pool.getConnection()
    conn.query('SELECT text, revision_id from files where ')
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

const createFile = async () => {

}

const createFolder = async () => {

}

const removeFile = async () => {

}

const removeFolder = async () => {

}

module.exports = {  getFileSystem,
                    getFile
}


