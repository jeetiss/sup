const { Server } = require('ws')
const { Dialog, Storage } = require('./src/dialogs')
const { User } = require('./src/user')
const { send, error, token: tk, rooms } = require('./src/utils')

const wss = new Server({ port: 1234 })
const storage = new Storage()

wss.on('connection', ws => {
  const user = new User(ws)

  ws.on('close', () => {
    user.unsubscribe()
    storage.remove(user.hash)
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
        case 'ws/select': {
          user.dhash = msg.name
          const dialog = storage.g(user.dhash)
          if (dialog) {
            user.unsubscribe()
            user.subscribeOn(dialog)
          } else {
            send(ws, error('room not exist'))
          }

          break
        }
        case 'ws/message': {
          if (!user.dhash) {
            send(ws, error('select room'))
          } else {
            storage.g(user.dhash).message(user.name, msg.text)
          }
        }
      }
    } else if (user.isAuth) {
      // auth men
      switch (msg.type) {
        case 'ws/message': {
          storage.g(user.token).message(user.name, msg.text)
        }
      }
    } else {
      // not auth men
      switch (msg.type) {
        case 'ws/auth': {
          const token = user.auth(msg.name, msg.pass, msg.token)

          if (user.isSupa) {
            send(ws, rooms(storage.all()))
          } else {
            const dialog = new Dialog()
            storage.add(token, dialog)
            user.subscribeOn(dialog)
          }

          send(ws, tk(token))
          break
        }

        default: {
          send(ws, error('auth need'))
        }
      }
    }
  })
})
