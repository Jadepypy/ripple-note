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
    const users = await conn.query('SELECT id, email, is_registered FROM users WHERE email = ? FOR UPDATE', [email])
    let user, result, id
    if(users[0].length > 0){
      [user] = users[0]
      if( user.is_registered == 1){
        await conn.query('COMMIT')
        return {error: 'Email already exists'}
      }
      id = user.id
      await conn.query('UPDATE users SET name = ?, provider = "native", is_registered = 1 WHERE id = ?', [name, id])
    } else{
      [result] = await conn.query('INSERT INTO users (name, email, password, provider) VALUES (?, ?, ?, ?)', [name, email , hash, 'native'])
      id = result.insertId
    }
    user = {
      id,
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
    const users = await pool.query('SELECT id, email, name, password, is_registered FROM users WHERE email = ?', [email])
    if(users[0].length === 0){
      return {error: 'Email not registered'}
    } 
    const [user] = users[0]
    if (user.is_registered == 0){
       return {error: 'Email not registered'}
    }
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

const addVaultUser = async (userID, vaultID, emails) => {
  const conn = await pool.getConnection()
  try{
    let [users] = await conn.query(
      `SELECT user_id FROM vault_user
      WHERE vault_id = ?`, [vaultID])
    let vaultUserIds = new Set()
    users.forEach(user => {
      vaultUserIds.add(user.user_id)
    })
    if(!vaultUserIds.has(userID)){
      return {error: 'Permission Denied'}
    }
    await conn.query('START TRANSACTION')
    let [result] = await conn.query('SELECT id, email FROM users WHERE email in (?) FOR UPDATE', [emails])
    let existingUsers = {}
    result.map(user => {
      existingUsers[user.email] = user.id
    })
    let registeredEmails = new Set(Object.keys(existingUsers))
    const addedUserIds = []
    for (const email of emails){
      if(!registeredEmails.has(email)){
        [result] = await conn.query('INSERT INTO users (email) VALUES (?)', [email])
         addedUserIds.push(result.insertId)
      } else if (!vaultUserIds.has(existingUsers[email])){
        addedUserIds.push(existingUsers[email])
      }
    }
    if(addedUserIds.length > 0){
      await conn.query('INSERT INTO vault_user (vault_id, user_id) VALUES ?', [addedUserIds.map((id) => [vaultID, id])])
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
const changeVaultName = async (userID, vaultID, name) => {
  const conn = await pool.getConnection()
  try{
    let [users] = await conn.query(
      `SELECT vault_id FROM vault_user
      WHERE user_id = ? and vault_id = ?`, [userID, vaultID])
    if(users.length < 1){
      return {error: 'Permission Denied'}
    }
    await conn.query(`UPDATE vaults SET name = ? WHERE id = ?`, [name, vaultID])
    return {}
  } catch (error){
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
                    addVaultUser,
                    changeVaultName,
}