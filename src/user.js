const { send, message } = require('./utils')

class User {
  constructor (ws) {
    this.isAuth = false
    this.isSupa = false
    this.subs = []
  }

  add (sub) {
    this.subs.push(sub)
  }

  unsub () {
    this.subs.forEach(s => s.unsubscribe())
    this.subs = []
  }

  auth (name, pass) {
    if (name === 'jeetiss' && pass === '1234') {
      this.isSupa = true
    }

    this.isAuth = true
    this.name = name
  }

  subscribe (dialogs, name, ws) {
    this.add(
      dialogs.subscribe(name, msg => send(ws, message(msg)))
    )
  }
}

module.exports = {
  User
}
