/**
This module uses disposer from bluebird's promises, so you need to import bluebird
Promise.
It also promisify all Connection prototype, i.e,
For every function in require('mysql/lib/Connection').prototype
  who takes a callback of two parameters,
  bluebird generates a identical Async variation of that function that returns promises
  instead of taking callback
  e.g,
    conn.query("SELECT name from users", (err, result) => {
      if(err)
        console.error(err)
      else
        console.log(result)
    })
  becomes
    conn.query("SELECT name from users")
      .then( result => console.log(result))
      .catch(err => console.error(err))
USAGE: Set the following enviourment vars, (you may use dotenv)
DB_HOST
DB_USER
DB_PASSWORD
DB_DATABASE
```
const connection = require('./connection.mysql.js')
const Promise = require('bluebird')

Promise.using(connection.getConnection(), conn => {
  //Use your connection here
  //It will be automatically released into pool once this block is finished.

  //To prevent connection from releasing into pool return a promise like
  return conn.queryAsync(
    "SELECT name from persons")
    .then( rows => {
      console.log("rows")
    })
})
```
*/

const Promise = require('bluebird')
const mysql = require('mysql')

Promise.promisifyAll(require('mysql/lib/Connection').prototype)

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
  connectTimeout: 10 * 1000,
  aquireTimeout: 10 * 1000,
  timeout: 10 * 1000
})
pool.on('connection', function (connection) {
  console.log('new connection', connection.threadId)
})
pool.on('destroy', function (err) {
  console.log(' connection destroy', err)
})
pool.on('end', function (err) {
  console.log('connection submitted in pool', err)
})
pool.on('error', function (err) {
  console.log('connection error', err)
})

function getConnectionAsync (pool) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) { reject(err) } else { resolve(conn) }
    })
        // console.log('hello');
  })
}
function getSqlConnection (pool) {
  return getConnectionAsync(pool)
    .disposer(conn =>
                    conn.release())
}
module.exports = {
  connectionPool: pool,
  getConnection: () => getSqlConnection(pool)
}
