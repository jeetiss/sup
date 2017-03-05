const msg = type => obj => {
  const m = Object.assign(obj, { type })
  console.log(`send: \n ${JSON.stringify(m)}`)
  return m
}
const error = text => msg('error')({ message: text })
const message = msg('message')
const rooms = r => msg(`room_${r.type}`)({ room: r.obj })
const user = user => msg('user')({ name: user.name, isAuth: user.isAuth, isSupa: user.isSupa, token: user.token })

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
