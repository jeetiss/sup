const { Server } = require('ws')
const { Dialog, Storage } = require('./src/dialogs')
const { User } = require('./src/user')
const { send, error, user: u } = require('./src/utils')
const fetch = require('node-fetch')
const port = process.env.PORT || 5000
const slackToken = process.env.SLACK_TOKEN || false

const wss = new Server({ port }, () => console.log('server working'))
const storage = new Storage()

wss.on('connection', ws => {
  const user = new User(ws)

  ws.on('close', async () => {
    user.unsubscribe()
    const dialog = await storage.g(user.token) || await storage.g(user.dhash)

    if (dialog && dialog.count() === 0) {
      storage.remove(dialog)
    }
  })

  ws.on('message', async data => {
    let msg
    try {
      msg = JSON.parse(data)
    } catch (err) {
      return send(ws, error('json need'))
    }

    // console.log(`receive ${data.length} symbols:\n ${JSON.stringify(msg)}`)

    if (user.isSupa) {
      // supa user
      switch (msg.type) {
        case 'ws/select': {
          let dialog = user.dhash && await storage.g(user.dhash)
          if (dialog) {
            user.unsubscribeOn(dialog)
            if (dialog.count() === 0) {
              storage.remove(dialog)
            }
          }

          user.dhash = msg.name
          dialog = await storage.g(user.dhash)

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
            (await storage.g(user.dhash)).message(user.name, msg.text)
          }
        }
      }
    } else if (user.isAuth) {
      // auth men
      switch (msg.type) {
        case 'ws/message': {
          (await storage.g(user.token)).message(user.name, msg.text)
        }
      }
    } else {
      // not auth men
      switch (msg.type) {
        case 'ws/auth': {
          const token = msg.token
            ? await user.authWithToken(msg.token)
            : user.auth(msg.name, msg.pass)

          if (!token) {
            send(ws, u(user))
            return
          }

          if (user.isSupa) {
            user.subscribeOn(storage)
          } else {
            const dialog = (await storage.g(
                user.token,
                Dialog.bind(null, user.token, user.name)
              )) || storage.add(new Dialog(user.token, user.name))

            user.subscribeOn(dialog)

            if (slackToken) {
              fetch(`https://hooks.slack.com/services/${slackToken}`, {
                method: 'POST',
                headers: 'Content-type: applicatiojson',
                body: JSON.stringify({text: `user ${user.name} login in supa app\n https://jeetiss.github.io/client/`})
              })
            }
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
