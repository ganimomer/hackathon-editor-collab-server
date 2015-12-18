'use strict'

const _ = require('lodash');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/mock-client.html')
});

let state;
const api = require('./utils/api');
const getState = () => state;
const reducer = require('./reducers/index');
const dispatch = event => {
    console.log('dispatching event', event.constructor.name, JSON.stringify(event));
    state = reducer(state, event);
    console.log('state became');
    console.dir(state);
    return state;
};

dispatch({});

const commands = _.mapValues(require('./commands'), function (fn) {
    return _.curry(fn)(dispatch, getState, api);
});

io.on('connection', (socket) => {
  console.log('connected', socket.id)

  socket.on('join', ({ id, userId, siteId }) => {
      commands.addParticipant({
          sessionId: siteId,
          participantId: id,
          participantInfo: {
              userId,
          }
      });

    // sessionManager.addUser(socket.id, data.userId)

    const editor = sessionManager.getSiteEditor(data.siteId)
    if (editor) {
      console.log(`${socket.id} requests history from ${editor}`)
      io.to(editor).emit('request-history', { id: socket.id, siteId: data.siteId });
    } else {
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

const PORT = 8080;
console.log('starting on port', PORT);
http.listen(parseInt(PORT, 10));
