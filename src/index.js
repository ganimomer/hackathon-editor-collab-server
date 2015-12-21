'use strict'

const _ = require('lodash');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/mock-client.html')
});

let state;
const NetworkAPI = require('./NetworkAPI');
const logger = require('./logger');
const getState = () => state;
const reducer = require('./reducers');
const dispatch = event => {
    logger.logEvent(event);
    logger.logStateBefore(state);
    state = reducer(state, event);
    logger.logStateAfter(state);
    return state;
};

dispatch({});

io.on('connection', (socket) => {
    logger.spacer();
    console.log('connected', socket.id)

    const api = new NetworkAPI(io, socket, getState);
    const commands = _.mapValues(require('./commands'), function (fn, key) {
        const commandName = fn.name;
        const curried = _.curry(fn)(dispatch, getState, api);

        return function commandShitCatcher() {
            try {
                logger.logCommand(commandName, arguments);
                return curried.apply(this, arguments);
            } catch (e) {
                console.error('shit happened in command', key);
                console.error(e.stack);
                console.error(e);
            }
        };
    });

    socket.on('join', ({ name, siteId }) => {
        commands.handleJoinRequest({
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
        commands.disconnectParticipant({
            participantId: socket.id,
        });
    });

    socket.on('error', (err) => {
        console.error(err);
    });
});

const PORT = 8080;
logger.spacer();
console.log('starting on port', PORT);
http.listen(parseInt(PORT, 10));
