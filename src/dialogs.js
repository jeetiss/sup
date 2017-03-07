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

  addRemHelper (ar, obj) {
    const idx = obj.id()
    const sendObj = {
      key: idx,
      name: obj.dialogName
    }

    if (ar === 'add') {
      this.storage[idx] = obj
    } else {
      delete this.storage[idx]
    }

    this.allObj.next({ type: 'all', obj: this.all() })
    this.emiter.next({ type: ar, obj: sendObj })

    return obj
  }

  add (obj) {
    return this.addRemHelper('add', obj)
  }

  g (hash) {
    return this.storage[hash]
  }

  remove (obj) {
    return this.addRemHelper('rem', obj)
  }

  all () {
    return Object
      .keys(this.storage)
      .map(key => ({key, name: this.storage[key].dialogName}))
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
  constructor (idx, username) {
    this.idx = idx
    this.dialogName = username
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
