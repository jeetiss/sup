const { Subject, ReplaySubject } = require('rxjs/Rx')
const { message, rooms } = require('./utils')

const firstMessage = {
  name: 'jeetiss',
  message: 'Привет, если тебе есть чего мне сказать то напиши',
  time: Date.now()
}

// add { type: 'add', obj }
// remove { type: 'rem', obj }

class Storage {
  constructor () {
    this.idx = `###${Math.random() * 1000}`
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

    return obj
  }

  g (hash) {
    return this.storage[hash]
  }

  remove (obj) {
    if (obj) {
      const idx = obj.id()
      delete this.storage[idx]
      this.allObj.next({ type: 'all', obj: this.all() })
      this.emiter.next({ type: 'rem', obj: idx })
    }
  }

  all () {
    return Object.keys(this.storage)
  }

  subscribe (cb) {
    return this.emiter.merge(this.allObj.first()).subscribe(cb)
  }

  id () {
    return this.idx
  }

  convertToUser (value) {
    return rooms(value)
  }
}

class Dialog {
  constructor (idx) {
    this.idx = idx
    this.messages = new ReplaySubject()
    this.messages.next(firstMessage)
    this.countSubs = 0
  }

  id () {
    return this.idx
  }

  count () {
    return this.countSubs
  }

  message (uname, message) {
    this.messages.next({
      name: uname,
      message,
      time: Date.now()
    })
  }

  convertToUser (value) {
    return message(value)
  }

  subscribe (cb) {
    this.countSubs += 1
    const subscription = this.messages.subscribe(cb)
    return {
      unsubscribe: () => {
        this.countSubs -= 1
        subscription.unsubscribe()
      }
    }
  }
}

module.exports = {
  Dialog,
  Storage
}
