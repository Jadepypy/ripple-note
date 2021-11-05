const { pool } = require('./mysql')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const SALT_ROUNDS = process.env.SALT_ROUNDS
const JWT_KEY = process.env.JWT_KEY

const signUp = async (name, email, password) => {
  let result = {}
  try {
    bcrypt.hash(password, SALT_ROUNDS, async (err, hash) => {
      // Store hash in your password DB.
      [result] = await pool.query('INSERT IGORE INTO files (name, email, password, provider) VALUES (?, ?, ?, ?)', [name, email, hash, 'native'])
      return result
    })
    .then((result) => {
      result.access_token = jwt.sign({ id: result.insertId, name, email}, JWT_KEY)
      return result
    })
    .catch((err) => {
      result.error = ''
    })
  } catch (error) {
    result.error = error
    console.log(error)
  }
}
//type, position, count, key
module.exports = { signUp,
}