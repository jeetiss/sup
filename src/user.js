const { send, message } = require('./utils')
const crypto = require('crypto')

function getHash (name) {
  const hmac = crypto.createHmac('sha256', 'secret word')

  hmac.update(`#${name}#${Date.now()}#`)
  return hmac.digest('hex')
}

const users = {}

class User {
  constructor (ws) {
    this.ws = ws
    this.isAuth = false
    this.isSupa = false
    this.subs = []
  }

  add (sub) {
    this.subs.push(sub)
  }

  unsubscribe () {
    this.subs.forEach(s => s.unsubscribe())
    this.subs = []
  }

  authWithToken (token) {
    if (token && users[token]) {
      Object.assign(this, users[token])

      return token
    }

    return
  }

  auth (name, pass) {
    const token = getHash(name)

    users[token] = {
      token,
      name,
      isAuth: true,
      isSupa: name === 'jeetiss' && pass === '1234'
    }

    Object.assign(this, users[token])

    return token
  }

  subscribeOn (dialog) {
    this.add(
      dialog.subscribe(msg => send(this.ws, message(msg)))
    )
  }
}

module.exports = {
  User
}
