const mysql = require('mysql2/promise');

//Set MySQL connection
const pool = mysql.createPool({
  connectionLimit: process.env.CONNECTION_LIMIT,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
})

module.exports = { pool }