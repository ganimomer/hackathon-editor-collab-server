'use strict'

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/mock-client.html')
})

io.on('connection', (socket) => {

  let userId
  let siteId

  console.log('connected');
  socket.emit('news', { hello: 'world' })

  socket.on('join', (data) => {
  	userId = data.userId
  	siteId = data.siteId
    socket.join(data.siteId);
  })

  socket.on('update', (data) => {
  	io.to(data.siteId).emit('change', data.message)
  })

  socket.on('disconnect', () => {
  	io.to(siteId).emit('leave', { userId })
  })
})

http.listen(8080)
