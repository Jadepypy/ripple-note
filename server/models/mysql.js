const mysql = require('mysql2/promise');
const NODE_ENV = process.env.NODE_ENV;

let database;
if (NODE_ENV === 'test') {
  database = process.env.DB_NAME_TEST;
} else {
  database = process.env.DB_NAME;
}
//Set MySQL connection
const pool = mysql.createPool({
  connectionLimit: process.env.CONNECTION_LIMIT,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database
});

module.exports = { pool };
