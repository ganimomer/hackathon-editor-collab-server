'use strict'

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const sessionManager = require('./session-manager')

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/mock-client.html')
})

const forAllRooms = (socket, action) => {
  socket.rooms
    .filter(room => room !== socket.id)
    .forEach(action)
}

io.on('connection', (socket) => {
  console.log('connected')

  socket.on('join', data => {
    sessionManager.join(socket.id, data)
    socket.join(data.siteId)
    socket.broadcast.to(data.siteId).emit('enter', data)
  })

  socket.on('message', data => {
    console.log(`message: ${JSON.stringify(data)}`)
    data.userId = sessionManager.getUser(socket.id)
    forAllRooms(socket, room => socket.broadcast.to(room).emit('message', data))
  })

  socket.on('disconnect', () => {
    const userId = sessionManager.getUser(socket.id)
    console.log(`${userId} has disconnected`)

    forAllRooms(socket, room => {
      const newEditor = sessionManager.leaveRoom(socket.id, room)
      if (newEditor) {
        io.to(room).emit('leave', { userId, newEditor })
      }
    })
  })
})

const port = process.argv[2] || 8080;
console.log('starting on port', port)
http.listen(parseInt(port, 10))
