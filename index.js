const { Server } = require('ws')
const { Dialog, Storage } = require('./src/dialogs')
const { User } = require('./src/user')
const { send, error, user: u } = require('./src/utils')
const port = process.env.PORT || 5000

const wss = new Server({ port }, () => console.log('server working'))
const storage = new Storage()

wss.on('connection', ws => {
  const user = new User(ws)

  ws.on('close', () => {
    user.unsubscribe()
    const dialog = storage.g(user.token) || storage.g(user.dhash)

    if (dialog && dialog.count() === 0) {
      storage.remove(dialog)
    }
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
          let dialog = storage.g(user.dhash)
          if (dialog) {
            user.unsubscribeOn(dialog)
            if (dialog.count() === 0) {
              storage.remove(dialog)
            }
          }

          user.dhash = msg.name
          dialog = storage.g(user.dhash)

          if (dialog) {
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
            user.subscribeOn(storage)
          } else {
            const dialog = storage.g(user.token) ||
              storage.add(new Dialog(user.token, user.name))

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
