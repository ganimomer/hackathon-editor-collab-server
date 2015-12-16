'use strict'

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const sessions = new Map()
const users = new Map()

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
    users.set(socket.id, data.userId)
    socket.join(data.siteId)
    const session = sessions.get(data.siteId)
    if (session) {
      session.viewing.push(data.userId)
      console.log(`${data.userId} has joined site ${data.siteId}`)
    } else {
      sessions.set(data.siteId, {
        editing: data.userId,
        viewing: []
      })
      console.log(`${data.userId} has started a session for site ${data.siteId}`)
    }
    socket.broadcast.to(data.siteId).emit('enter', data)
  })

  socket.on('message', data => {
    console.log(`message: ${JSON.stringify(data)}`)
    data.userId = users.get(socket.id)
    forAllRooms(socket, room => socket.broadcast.to(room).emit('message', data))
  })

  socket.on('disconnect', () => {
    const userId = users.get(socket.id)
    console.log(`${userId} has disconnected`)

    forAllRooms(socket, room => {
      const session = sessions.get(room)
      if (userId === session.editing) {
        const newEditor = session.viewing.shift()
        if (newEditor) {
          session.editing = newEditor
          io.to(room).emit('leave', { userId, newEditor })
          console.log(`${userId} was king but now ${newEditor} was crowned`)
        } else {
          sessions.delete(room)
          console.log(`${userId} was king but now the kingdom is gone`)
        }
      } else {
        session.viewing.splice(session.viewing.indexOf(userId), 1)
        io.to(room).emit('leave', { userId })
      }
    })
  })
})

const port = process.argv[2] || 8080;
console.log('starting on port', port)
http.listen(parseInt(port, 10))
