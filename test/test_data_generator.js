require('dotenv').config()
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS)
const bcrypt = require('bcrypt')
const {NODE_ENV} = process.env
const {pool} = require('../server/models/mysql');
const {vault, users, file} = require('./fake_data')

function tidyUserData(user){
  return new Promise((resolve, reject) => {
    bcrypt.hash(user.password, SALT_ROUNDS, (error, hash) => {
      if(error){
        return reject(error.message)
      }
      user.password = hash
      user.is_registered = 1
      return resolve(Object.values(user))
    })
  })
}

async function _createFakeVault(conn){
  const [result] = await conn.query('INSERT INTO vaults SET ?', [vault]);
  vault.id = result.insertId
}

async function _createFakeUser(conn){
  const encrptedUsers = await Promise.all(users.map(user => {
   return tidyUserData(user)
  }))
  const [result] = await conn.query('INSERT INTO users (name, email, password, is_registered) VALUES ?', [encrptedUsers])
  const vaultUsers = []
  let userId = result.insertId
  for (let i = 0; i < users.length; i++){
    vaultUsers.push([vault.id, userId++])
  }
  return await conn.query('INSERT INTO vault_user (vault_id, user_id) VALUES ?', [vaultUsers])
} 
async function _createFakeFile(conn){
  file.vault_id = vault.id
  const [result] = await conn.query('INSERT INTO folder_file SET ?', [file])
  const fileId = result.insertId
  await conn.query('INSERT INTO files (file_id, revision_id, text) VALUES (?, 0, "")', [fileId])
  return await conn.query('UPDATE vaults SET first_child_id = ? WHERE id = ?', [vault.id, fileId])
}
async function createFakeData() {
    const conn = await pool.getConnection();
    await conn.query('START TRANSACTION');
    await conn.query('SET FOREIGN_KEY_CHECKS = ?', 0);
    await _createFakeVault(conn);
    await _createFakeUser(conn);
    await _createFakeFile(conn)
    await conn.query('SET FOREIGN_KEY_CHECKS = ?', 1);
    await conn.query('COMMIT');
    await conn.release();
}

async function truncateTable(conn, table){
  return await conn.query(`TRUNCATE TABLE ${table}`);
}
async function deleteFakeData(){
  const conn = await pool.getConnection();
  const tables = ['vaults', 'users', 'vault_user', 'folder_file', 'files']
  await conn.query('START TRANSACTION');
  await conn.query('SET FOREIGN_KEY_CHECKS = ?', 0);
  await Promise.all(tables.map(table => {
    truncateTable(conn, table)
  }))
  await conn.query('SET FOREIGN_KEY_CHECKS = ?', 1);
  await conn.query('COMMIT');
  await conn.release();
}

async function main() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env')
    return
  }
  await deleteFakeData();
  await createFakeData();
}

// execute when called directly.
if (require.main === module) {
    main();
}

module.exports = {
    createFakeData,
    deleteFakeData,
}