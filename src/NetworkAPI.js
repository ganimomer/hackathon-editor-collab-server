const _ = require('lodash');
const logger = require('./logger');

function broadcastMessage({ participantId, message }) {
    return ['message', { participantId, message }];
    // TODO: find out what it means
}

function resolveSockets(state, { to, except, broadcastTo }) {
    let recipients;

    if (!to && !broadcastTo) {
        throw 'unresolvable sockets, ya';
    }

    if (to) {
        recipients = _.isArray(to) ? to : [to];
    } else {
        const { presenter, spectators } = state.sessions.get(broadcastTo);
        recipients = _.pluck(Array.from(spectators.values()).concat([presenter]), 'id');
    }

    if (except) {
        except = _.isArray(except) ? except : [except]
        recipients = _.without(recipients, ...except);
    }

    return recipients;
}

function buildEmitter(eventName) {
    return function emitter(routeInfo, message) {
        logger.logNetworkRequest(eventName, routeInfo, message);

        const { io, socket, getState } = this;
        const state = getState();
        const recipients = resolveSockets(state, routeInfo);
        const sockets = recipients.map(id => io.to(id));

        if (_.indexOf(recipients, undefined) >= 0) {
            console.log('some shit, bro');
        }
        sockets.forEach(socket => socket.emit(eventName, message));
        recipients.forEach(id => logger.logSocket(id));
        logger.spacer();
    };
}

function NetworkAPI(io, socket, getState) {
    this.io = io;
    this.socket = socket;
    this.getState = getState;
}

NetworkAPI.prototype = {
    requestSnapshot: buildEmitter('request-snapshot'),
    sendSession: buildEmitter('session'),
    announcePresenterChanged: buildEmitter('presenter-changed'),
    announceNewSpectators: buildEmitter('spectator-joined'),
    announceLeavingSpectator: buildEmitter('spectator-left'),
    broadcastChange: buildEmitter('change'),
    broadcastMessage: buildEmitter('message'),
};

module.exports = NetworkAPI;
