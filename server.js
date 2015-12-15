'use strict'

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const sessions = new Map();
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/mock-client.html')
})

io.on('connection', (socket) => {

  let userId
  let siteId

  console.log('connected');
  socket.on('join', (data) => {
  	userId = data.userId
  	siteId = data.siteId
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

  socket.on('message', (data) => {
    console.log(`message: ${JSON.stringify(data)}`)
    data.userId = userId
    socket.broadcast.to(siteId).emit('message', data)
  })

  socket.on('disconnect', () => {
    console.log(`${userId} has disconnected`)
    const session = sessions.get(siteId)
    if (userId === session.editing) {
      const newEditor = session.viewing.shift()
      if (newEditor) {
        session.editing = newEditor
        io.to(siteId).emit('leave', { userId, newEditor })
        console.log(`${userId} was king but now ${newEditor} was crowned`)
      } else {
        sessions.delete(siteId)
        console.log(`${userId} was king but now the kingdom is gone`)
      }
    } else {
      session.viewing.splice(session.viewing.indexOf(userId), 1)
      io.to(siteId).emit('leave', { userId })
    }
  })
})

const port = process.argv[2]
console.log(port)
http.listen(parseInt(port, 10))
