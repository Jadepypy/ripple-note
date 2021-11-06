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

module.exports = {  CONNECTION_TYPE,
                    signUp,
                    nativeSignIn,
                    getVaults,
}