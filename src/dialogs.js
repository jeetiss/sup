const { Subject, ReplaySubject } = require('rxjs/Rx')
// const { error } = require('./utils')

const firstMessage = {
  name: 'jeetiss',
  message: 'Привет, я могу в вебчик, если тебе есть чего мне сказать то напиши',
  time: Date.now()
}

// add { type: 'add', obj }
// remove { type: 'remove', obj }

class Storage {
  constructor () {
    this.id = `###${Math.random() * 1000}`
    this.emiter = new Subject()
    this.allObj = new ReplaySubject(1)

    this.allObj.next({ type: 'all', obj: [] })

    this.storage = {}
  }

  add (obj) {
    const idx = obj.id()
    this.storage[idx] = obj
    this.allObj.next({ type: 'all', obj: this.all() })
    this.emiter.next({ type: 'add', obj: idx })
  }

  g (hash) {
    return this.storage[hash]
  }

  remove (obj) {
    const idx = obj.id()
    delete this.storage[idx]
    this.allObj.next({ type: 'all', obj: this.all() })
    this.emiter.next({ type: 'remove', obj: idx })
  }

  all () {
    return Object.keys(this.storage)
  }

  subscribe (cb) {
    return this.emiter.merge(this.allObj.first()).subscribe(cb)
  }
}

class Dialog {
  constructor (idx) {
    this.idx = idx
    this.messages = new ReplaySubject()
    this.messages.next(firstMessage)
  }

  id () {
    return this.idx
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
