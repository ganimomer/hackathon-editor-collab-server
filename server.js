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
  console.log('connected', socket.id)

  socket.on('join', data => {
    sessionManager.addUser(socket.id, data.userId)
    const editor = sessionManager.getSiteEditor(data.siteId)
    if (editor) {
      console.log(`${socket.id} requests history from ${editor}`)
      io.to(editor).emit('request-history', { id: socket.id, siteId: data.siteId });
    } else {
      console.log(`${socket.id} is the first human on the Earth`)
      sessionManager.join(Object.assign(data, { id: socket.id }))
      socket.join(data.siteId)
    }
  })

  socket.on('history', data => {
    const viewerSocket = io.sockets.connected[data.id]
    const editor = sessionManager.getSiteEditor(data.siteId)
    console.log(`${editor} sent history to ${viewerSocket.id}`)
    viewerSocket.emit('history', data.history);
    sessionManager.join(data)
    viewerSocket.join(data.siteId)
    viewerSocket.broadcast.to(data.siteId).emit('enter', {
      userId: sessionManager.getUser(data.id),
      siteId: data.siteId
    })
  })

  socket.on('message', data => {
    // console.log(`message: ${JSON.stringify(data)}`)
    console.log(`message: from ${socket.id} to `)
    data.userId = sessionManager.getUser(socket.id)
    forAllRooms(socket, room => socket.broadcast.to(room).emit('message', data))
  })

  socket.on('disconnect', () => {
    const userId = sessionManager.getUser(socket.id)
    console.log(`${userId} has disconnected`)

    forAllRooms(socket, room => {
      const newEditor = sessionManager.leaveSite(socket.id, room)
      if (newEditor) {
        io.to(room).emit('leave', { userId, newEditor })
      }
    })
  })
})

//const port = process.argv[2] || 8080;
const port = 8080;
console.log('starting on port', port)
http.listen(parseInt(port, 10))
