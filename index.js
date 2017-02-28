const { Server } = require('ws')
const { ReplaySubject } = require('rxjs/Rx')
const wss = new Server({ port: 1234 })

const msg = type => obj => Object.assign(obj, { type })
const error = text => msg('error')({ message: text })
const fuiw = msg('message')
const rooms = r => msg('rooms')({ rooms: r })

function send (ws, json) {
  ws.send(JSON.stringify(json))
}

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
}

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

const dialogs = new Dialogs()

wss.on('connection', ws => {
  const user = new User(ws)

  ws.on('close', () => {
    user.unsub()
  })

  ws.on('message', data => {
    let msg
    try {
      msg = JSON.parse(data)
    } catch (err) {
      return send(ws, error('json need'))
    }

    if (user.isSupa) {
      // supa user
      switch (msg.type) {
        case 'select': {
          try {
            user.unsub()
            user.dname = msg.name
            user.add(
              dialogs.subscribe(user.dname, message => send(ws, fuiw(message)))
            )
          } catch (err) {
            send(ws, err)
          }

          break
        }
        case 'message': {
          if (!user.dname) {
            send(ws, error('select room'))
          } else {
            dialogs.message(user.dname, user.name, msg.text)
          }
        }
      }
    } else if (user.isAuth) {
      // auth men
      switch (msg.type) {
        case 'message': {
          dialogs.message(user.name, user.name, msg.text)
        }
      }
    } else {
      // not auth men
      switch (msg.type) {
        case 'auth': {
          user.auth(msg.name, msg.pass)

          if (user.isSupa) {
            send(ws, rooms(dialogs.all()))
          } else {
            dialogs.add(user.name)
            user.subs.push(
              dialogs.subscribe(user.name, message => send(ws, fuiw(message)))
            )
          }

          break
        }

        default: {
          send(ws, error('auth need'))
        }
      }
    }
  })
})
