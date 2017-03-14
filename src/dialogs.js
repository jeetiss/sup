const { Subject, ReplaySubject } = require('rxjs/Rx')
const { message, rooms } = require('./utils')
const { createSL } = require('./db')
const { store, load } = createSL('dialog')

const firstMessage = name => ({
  name: 'jeetiss',
  text: `Привет, ${name}. Я Ивахненко Дмитрий веб разработчик. Напиши мне`,
  time: Date.now()
})

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
      store(idx, obj.getValues())
      delete this.storage[idx]
    }

    this.allObj.next({ type: 'all', obj: this.all() })
    this.emiter.next({ type: ar, obj: sendObj })

    return obj
  }

  add (obj) {
    return this.addRemHelper('add', obj)
  }

  async g (hash, Ctor) {
    let obj = this.storage[hash]
    if (obj) return obj

    obj = await load(hash)
    if (obj && Ctor) {
      this.add(new Ctor(obj))
      return this.storage[hash]
    }
    return
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
  constructor (idx, username, messages = firstMessage(username)) {
    this.idx = idx
    this.dialogName = username
    this.messages = new ReplaySubject()
    this.messages.next(messages)
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
      text: message,
      time: Date.now()
    })
  }

  convertToUser (value) {
    return message(value)
  }

  getValues () {
    let val = []

    const sub = this.subscribe(value => { val = val.concat(value) })
    sub.unsubscribe()

    return val
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
