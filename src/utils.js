const msg = type => obj => Object.assign(obj, { type })
const error = text => msg('error')({ message: text })
const message = msg('message')
const rooms = r => msg('rooms')({ rooms: r })
const user = user => msg('user')({ name: user.name, isSupa: user.isSupa, token: user.token })

function send (ws, json) {
  ws.send(JSON.stringify(json))
}

module.exports = {
  error,
  rooms,
  message,
  user,
  send
}
