const { Server } = require('ws')
const { Dialogs } = require('./src/dialogs')
const { User } = require('./src/user')
const { send, error, rooms } = require('./src/utils')

const wss = new Server({ port: 1234 })
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
            user.subscribe(dialogs, user.dname, ws)
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
            user.subscribe(dialogs, user.name, ws)
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
