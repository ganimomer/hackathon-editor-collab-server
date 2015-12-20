'use strict'

const _ = require('lodash');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/mock-client.html')
});

let state;
const NetworkAPI = require('./utils/api');
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

io.on('connection', (socket) => {
    console.log('connected', socket.id)

    const api = new NetworkAPI(io, socket, getState);
    const commands = _.mapValues(require('./commands'), function (fn) {
        return _.curry(fn)(dispatch, getState, api);
    });

    socket.on('join', ({ name, siteId }) => {
        commands.addParticipant({
            sessionId: siteId,
            participant: {
                id: socket.id,
                email: name,
            },
        });
    });

    socket.on('snapshot', ({ snapshot }) => {
        commands.sendSnapshot({
            issuerId: socket.id,
            snapshot: snapshot,
        });
    });

    socket.on('change', (change) => {
        commands.broadcastChange({
            issuerId: socket.id,
            change,
        });
    });

    socket.on('message', (message) => {
        commands.broadcastMessage({
            issuerId: socket.id,
            message,
        });
    });

    socket.on('request-control', () => {
        commands.requestControl({
            issuerId: socket.id,
        });
    });

    socket.on('grant-control', ({ spectatorId }) => {
        commands.transferPresentership({
            issuerId: socket.id,
            newPresenterId: spectatorId,
        });
    });

    socket.on('deny-control', ({ spectatorId }) => {
        commands.denyControl({
            issuerId: socket.id,
            spectatorId,
        });
    });

    socket.on('disconnect', () => {
        commands.removeParticipant({
            participantId: socket.id,
        });
    });
});

const PORT = 8080;
console.log('starting on port', PORT);
http.listen(parseInt(PORT, 10));
