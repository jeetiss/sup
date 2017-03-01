const { ReplaySubject } = require('rxjs/Rx')
const { error } = require('./utils')

const firstMessage = {
  name: 'jeetiss',
  message: 'Привет, я могу в вебчик, если тебе есть чего мне сказать то напиши',
  time: Date.now()
}

class Dialogs {
  constructor () {
    this.dialogs = {}
  }

  add (name) {
    if (!this.dialogs[name]) {
      this.dialogs[name] = {
        subj: new ReplaySubject(),
        subs: []
      }

      this.dialogs[name].subj.next(firstMessage)
    }
  }

  message (dname, uname, message) {
    this.dialogs[dname].subj.next({
      name: uname,
      message,
      time: Date.now()
    })
  }

  remove (name) {
    if (this.dialogs[name]) {
      this.dialogs.subs.forEach(s => s.unsubscribe())
      delete this.dialogs[name]
    }
  }

  all () {
    return Object.keys(this.dialogs)
  }

  subscribe (name, cb) {
    if (this.dialogs[name]) {
      const subs = this.dialogs[name].subj.subscribe(cb)
      this.dialogs[name].subs.push(subs)

      return subs
    } else {
      throw error('not exist room')
    }
  }
}

module.exports = {
  Dialogs
}
