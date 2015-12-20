const _ = require('lodash');

function requestSnapshot(socket) {
    socket.emit('request-snapshot');
}

function sendSession(socket, { id, presenterId, participants, snapshot }) {
    socket.emit('session', { id, presenterId, participants, snapshot });
}

function announcePresenterChanged(socket, { presenterId }) {
    socket.emit('presenter-changed', { presenterId });
}

function announceNewSpectators(socket, newSpectators) {
    socket.emit('spectator-joined', newSpectators);
}

function announceLeavingSpectator(socket, { spectatorId }) {
    socket.emit('spectator-left', { spectatorId });
}

function broadcastChange(socket, change) {
    socket.emit('change', change);
}

function broadcastMessage(socket, { participantId, message }) {
    socket.emit('message', { participantId, message });
    // TODO: find out what it means
}

function resolveSockets(io, socket, state, { to, except, broadcastTo }) {
    let recipients;

    if (!to && !broadcastTo) {
        throw 'unresolvable sockets, ya';
    }

    if (to) {
        recipients = _.isArray(to) ? to : [to];
    } else {
        const { presenter, spectators } = state.sessions.get(broadcastTo);
        recipients = _.pluck([presenter, ...spectators], 'id');
    }

    if (except) {
        recipients = _.without(recipients, _.isArray(except) ? except : [except]);
    }

    return recipients.map(id => io.to(id));
}

function wrap(fn) {
    const fnName = fn.name;

    return function routeWrapped(routeInfo, message) {
        console.log('called network api', fnName);

        const { io, socket, getState } = this;
        const state = getState();
        const recipients = resolveSockets(io, socket, state, routeInfo);

        recipients.forEach(socket => fn(socket, message));
    };
}

function NetworkAPI(io, socket, getState) {
    this.io = io;
    this.socket = socket;
    this.getState = getState;
}

NetworkAPI.prototype = {
    requestSnapshot: wrap(requestSnapshot),
    sendSession: wrap(sendSession),
    announcePresenterChanged: wrap(announcePresenterChanged),
    announceNewSpectators: wrap(announceNewSpectators),
    announceLeavingSpectator: wrap(announceLeavingSpectator),
    broadcastChange: wrap(broadcastChange),
    broadcastMessage: wrap(broadcastMessage),
};

module.exports = NetworkAPI;
