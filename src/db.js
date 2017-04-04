
const redis = require('redis')
const redisUrl = process.env.REDIS_URL
const client = redis.createClient(redisUrl)

function createSL (name) {
  function promisify (cb) {
    return new Promise((resolve, reject) => {
      cb((err, value) => {
        if (err) reject(err)
        else resolve(value)
      })
    })
  }

  function store (key, obj) {
    client.hset(name, key, JSON.stringify(obj))
  }

  function loadAll () {
    return promisify(done => client.hgetall([name], done))
  }

  function load (key) {
    return promisify(done => client.hget([name, key], done))
      .then(value => JSON.parse(value))
  }

  return { store, load, loadAll }
}


module.exports = { createSL }
