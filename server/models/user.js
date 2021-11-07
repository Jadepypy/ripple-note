const { pool } = require('./mysql')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS)
const JWT_KEY = process.env.JWT_KEY
const CONNECTION_TYPE = {
  'HTTP': 0,
  'WEB_SOCKET': 1
}

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (error, hash) => {
      if(error){
        return reject(error.message)
      }
      return resolve(hash)
    })
  })
}
const comparePassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error, isSame) => {
      if(error){
        return reject(error.message)
      }
      return resolve(isSame)
    })
  })
}
const signUp = async (name, email, password) => {
  const conn = await pool.getConnection()
  try {
    const hash = await hashPassword(password)
    const emails = await conn.query('SELECT email FROM users WHERE email = ? FOR UPDATE', [email])
    console.log(emails)
    if(emails[0].length > 0){
      await conn.query('COMMIT')
      return {error: 'Email already exists'}
    }
    const [result] = await conn.query('INSERT INTO users (name, email, password, provider) VALUES (?, ?, ?, ?)', [name, email , hash, 'native'])
    const user = {
      id: result.insertId,
      name,
      email
    }
    const access_token = jwt.sign(user, JWT_KEY)
    user.access_token = access_token
    await conn.query('COMMIT')
    return {user}
  } catch (error) {
    console.log(error)
    conn.release()
    return {error}
  } finally{
    conn.release()
  }
}
const nativeSignIn = async (email, password) => {
  try {
    const users = await pool.query('SELECT id, email name, password FROM users WHERE email = ?', [email])
    if(users[0].length === 0){
      return {error: 'Email not registered'}
    }
    const [user] = users[0]
    const isSame = await comparePassword(password,user.password)
    if(!isSame){
      return {error: 'Wrong Password'}
    }
    user.access_token = jwt.sign(user, JWT_KEY)
    return {user}
  } catch (error) {
    console.log(error)
    return {error}
  }
}
const getVaults = async (id) => {
  try{
    const [vaults] = await pool.query(  `SELECT vaults.id, name, created_at 
                                  FROM vault_user join vaults 
                                  on vault_user.vault_id = vaults.id
                                  WHERE vault_user.user_id = ?`, [id])
    return {vaults}
  } catch (error){
    console.log(error)
    return {error}
  }
}
const getVault = async (userID, vaultID) => {
  try{
    let [users] = await pool.query(
      `SELECT vault_id FROM vault_user
      WHERE user_id = ? and vault_id = ?`, [userID, vaultID])
    if(users.length < 1){
      return {error: 'Permission Denied'}
    }
    [users] = await pool.query( 
    `SELECT vaults.name, users.email
    FROM vault_user join vaults 
    on vault_user.vault_id = vaults.id
    join users on users.id = vault_user.user_id
    WHERE vault_user.vault_id = ?`, [vaultID])
    console.log(vaultID, users)
    return {users}
  } catch (error){
    console.log(error)
    return {error}
  }
}
const deleteVault = async (userID, vaultID) => {
  const conn = await pool.getConnection()
  try{
    await conn.query('START TRANSACTION')
    const [result] = await conn.query('DELETE FROM vault_user WHERE vault_id = ? and user_id = ?', [vaultID, userID])
    const [users] = await conn.query('SELECT user_id FROM vault_user WHERE vault_id = ?', [vaultID])
    if(users.length < 1){
      await conn.query('DELETE FROM vaults WHERE id = ?', [vaultID])
    }
    await conn.query('COMMIT')
    return {}
  } catch(error) {
    await conn.query('ROLLBACK')
    conn.release()
    console.log(error)
    return {error}
  } finally{
    conn.release()
  }
}
const createVault = async (userID, createdAt, name) => {
  const conn = await pool.getConnection()
  try{
    await conn.query('START TRANSACTION')
    const [result] = await conn.query('INSERT INTO vaults (name, created_at) VALUES (?, ?)', [name, createdAt])
    await conn.query('INSERT INTO vault_user (vault_id, user_id) VALUES (?, ?)', [result.insertId, userID])
    await conn.query('COMMIT')
    return {id: result.insertId}
  } catch(error) {
    await conn.query('ROLLBACK')
    conn.release()
    console.log(error)
    return {error}
  } finally{
    conn.release()
  }
}

module.exports = {  CONNECTION_TYPE,
                    signUp,
                    nativeSignIn,
                    getVaults,
                    getVault,
                    deleteVault,
                    createVault,

}