/**
This module uses disposer from bluebird's promises, so you need to import bluebird
Promise.
USAGE: Set the following enviourment vars, (you may use dotenv)
DB_HOST
DB_USER
DB_PASSWORD
DB_DATABASE
PGPORT
```
const connection = require('./connection.postgres.js')
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
const pg = require('pg')

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.PGPORT || '5432',
  max: 10,
  idleTimeoutMillis: 30000
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
  console.error('idle client error', err.message, err.stack)
})

/**
 * Wraps the promise returned by pg.connect() with bluebird's promise
 * with bluebird's resource management functionallity(disposer)
*/
function getSqlConnection (pool) {
  return new Promise((resolve, reject) => {
    pool.connect()
      .then(conn => resolve(conn))
      .catch(e => reject(e))
  }).disposer(conn => conn.release())
}

module.exports = {
  connectionPool: pool,
  getConnection: () => getSqlConnection(pool)
}
