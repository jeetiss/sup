const msg = type => obj => Object.assign(obj, { type })
const error = text => msg('error')({ message: text })
const message = msg('message')
const rooms = r => msg('rooms')({ rooms: r })

function send (ws, json) {
  ws.send(JSON.stringify(json))
}

module.exports = {
  error,
  rooms,
  message,
  send
}
