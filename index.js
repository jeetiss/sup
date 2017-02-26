const { Server } = require('ws')
const wss = new Server({ port: 1234 })

class Sockux {
  constructor (wss) {
    this.wss = wss
    this.middlewares = []
  }

  use (middleware) {
    this.middlewares.push(middleware)
  }

  route (type, handler) {
    const routeMiddleware = (req, local, global, next) => {
      if (req.json.type === type) {
        handler(req, local, global)
        return
      }

      next()
    }

    this.middlewares.push(routeMiddleware)
  }

  start () {
    const globalScope = { clients: this.wss.clients }

    this.wss.on('connection', ws => {
      const localScope = { ws }

      ws.on('message', data => {
        const req = { data }
        this.handle(req, localScope, globalScope)
      })
    })
  }

  handle (req, local, global) {
    let index = 0

    const next = () => {
      const callback = this.middlewares[index++]

      if (callback) {
        callback(req, local, global, next)
      }
    }

    next()
  }
}

const server = new Sockux(wss)

const logger = function (req, local, global, next) {
  const start = Date.now()
  next()
  console.log(`receive: ${req.data} - ${Date.now() - start} ms`)
}

const jsonParse = function (req, local, global, next) {
  try {
    req.json = JSON.parse(req.data)
    next()
  } catch (err) {
    local.ws.send('only json allowed')
  }
}

server.use(logger)
server.use(jsonParse)

server.route('msg', (req, local, global) => {
  local.ws.send(JSON.stringify({hello: 'world'}))
})


server.use(function (req, local) {
  local.ws.send(req.json['foo'] + 10)
})

server.start()
