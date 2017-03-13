
const redis = require('redis')
const redisUrl = process.env.REDIS_URL
const client = redis.createClient(redisUrl)

function createSL (name) {
  function store (key, obj) {
    client.hset(name, key, JSON.stringify(obj))
  }

  function load (key) {
    return new Promise(resolve => {
      client.hget([name, key], (err, value) => {
        if (err) console.error(err)
        resolve(JSON.parse(value))
      })
    })
  }

  return { store, load }
}


module.exports = { createSL }
