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
Since the underlying pg-pool lib of pg have a query method on pool,
which just run a query and return the client to the pool afterward.
We can use this like
```js
  const { connectionPool } = require('./connection.postgres.js')
  connectionPool.query("SELECT name from persons")
      .then( rows => {
        console.log("rows")
      })
```

**pro tip:** unless you need to run a transaction
  (which requires a single client for multiple queries) or you have some other
  edge case like streaming rows or using a cursor you should almost always just
  use pool.query. Its easy, it does the right thing :tm:, and wont ever forget
  to return clients back to the pool after the query is done.

**SEE** https://github.com/brianc/node-pg-pool#your-new-favorite-helper-method
*/

const Promise = require('bluebird')
const pg = require('pg')

// create the pool and let it live
// 'globally' here, controlling access to it through exported methods
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.PGPORT || '5432',
  max: 10,
  idleTimeoutMillis: 30000
})

/* Later in the release we will replace the built-in A+ promise with bluebird
using
var bluebirdPool = new Pool({
  Promise: require('bluebird')
})
*/

// Just some debbuging logs, you may safely remove these
pool.on('connect', function (connection) {
  console.log('new connection', connection.threadId)
})
pool.on('acquire', client => {
  console.log('connection acquired')
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
