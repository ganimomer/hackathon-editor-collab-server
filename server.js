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
    socket.join(data.siteId)
    socket.broadcast.to(data.siteId).emit('enter', data)
    console.log(`${data.userId} has joined site ${data.siteId}`)
  })

  socket.on('update', (data) => {
  	socket.broadcast.to(data.siteId).emit('change', data)
  })

  socket.on('disconnect', () => {
  	io.to(siteId).emit('leave', { userId })
  })
})

let port = process.argv[2]
console.log(port)
http.listen(parseInt(port, 10))
