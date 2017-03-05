const { send } = require('./utils')
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
    this.subs = {}
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

  subscribeOn (pub) {
    this.subs[pub.id()] = pub
      .subscribe(msg => send(this.ws, pub.convertToUser(msg)))
  }

  unsubscribeOn (pub) {
    const idx = pub.id()
    this.subs[idx].unsubscribe()
    delete this.subs[idx]
  }

  unsubscribe () {
    Object.values(this.subs).forEach(value => value.unsubscribe())
    this.subs = {}
  }
}

module.exports = {
  User
}
