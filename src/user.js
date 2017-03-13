const { send } = require('./utils')
const { createSL } = require('./db')
const crypto = require('crypto')
const supaName = process.env.SUPA_NAME || 'jeetiss'
const supaPass = process.env.SUPA_PASS || '1234'
const supaSercet = process.env.SUPA_SECRET || 'secret'

function getHash (name) {
  const hmac = crypto.createHmac('sha256', supaSercet)

  hmac.update(`#${name}#${Date.now()}#`)
  return hmac.digest('hex')
}

const { store, load } = createSL('user')

class User {
  constructor (ws) {
    this.ws = ws
    this.isAuth = false
    this.isSupa = false
    this.subs = {}
  }

  async authWithToken (token) {
    if (!token) return
    const user = await load(token)
    if (!user) return
    Object.assign(this, user)
    return token
  }

  auth (name, pass) {
    const token = getHash(name)

    const user = {
      token,
      name,
      isAuth: true,
      isSupa: name === supaName && pass === supaPass
    }

    store(token, user)

    Object.assign(this, user)

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

module.exports = { User }
