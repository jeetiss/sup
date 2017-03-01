const { ReplaySubject } = require('rxjs/Rx')
// const { error } = require('./utils')

const firstMessage = {
  name: 'jeetiss',
  message: 'Привет, я могу в вебчик, если тебе есть чего мне сказать то напиши',
  time: Date.now()
}

class Storage {
  constructor () {
    this.storage = {}
  }

  add (hash, obj) {
    this.storage[hash] = obj
  }

  g (hash) {
    return this.storage[hash]
  }

  remove (hash) {
    delete this.storage[hash]
  }

  all () {
    return Object.keys(this.storage)
  }
}

class Dialog {
  constructor () {
    this.messages = new ReplaySubject()
    this.messages.next(firstMessage)
  }

  message (uname, message) {
    this.messages.next({
      name: uname,
      message,
      time: Date.now()
    })
  }

  subscribe (cb) {
    return this.messages.subscribe(cb)
  }
}

module.exports = {
  Dialog,
  Storage
}
