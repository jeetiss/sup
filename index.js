const { Server } = require('ws')
const { Dialog, Storage } = require('./src/dialogs')
const { User } = require('./src/user')
const { send, error, user: u, rooms } = require('./src/utils')

const wss = new Server({ port: 1234 }, () => console.log('server working'))
const storage = new Storage()

storage.subscribe(val => console.log(`\n\n\n${JSON.stringify(val)}\n\n\n`))

wss.on('connection', ws => {
  const user = new User(ws)

  ws.on('close', () => {
    user.unsubscribe()
    storage.remove(
      storage.g(user.token)
    )
  })

  ws.on('message', data => {
    let msg
    try {
      msg = JSON.parse(data)
    } catch (err) {
      return send(ws, error('json need'))
    }

    console.log(`receive ${data.length} symbols:\n ${JSON.stringify(msg)}`)

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
          const token = msg.token
            ? user.authWithToken(msg.token)
            : user.auth(msg.name, msg.pass)

          if (!token) {
            send(ws, u(user))
            return
          }

          if (user.isSupa) {
            send(ws, rooms(storage.all()))
          } else {
            const dialog = new Dialog(user.token)
            storage.add(dialog)
            user.subscribeOn(dialog)
          }

          send(ws, u(user))
          break
        }

        default: {
          send(ws, error('auth need'))
        }
      }
    }
  })
})
