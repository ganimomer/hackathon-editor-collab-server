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
        recipients = [presenter.id, ...spectators.keys()];
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

        const { sockets, getState } = this;
        const state = getState();
        const recipients = resolveSockets(state, routeInfo);
        const _sockets = recipients.map(id => sockets[id]);

        if (_.indexOf(recipients, undefined) >= 0) {
            console.log('some shit, bro');
        }

        _sockets.forEach(socket => socket.emit(eventName, message));
        recipients.forEach(id => logger.logSocket(id));
        logger.spacer();
    };
}

function NetworkAPI(getState) {
    this.sockets = {};
    this.getState = getState;
}

NetworkAPI.prototype = {
    addSocket(id, socket) {
        this.sockets[id] = socket;
    },
    removeSocket(id) {
        delete this.sockets[id];
    },
    requestSnapshot: buildEmitter('request-snapshot'),
    sendSession: buildEmitter('session'),
    informControlRequested: buildEmitter('control-requested'),
    informControlDenied: buildEmitter('control-denied'),
    broadcastChange: buildEmitter('change'),
    broadcastChat: buildEmitter('chat'),
};

module.exports = NetworkAPI;
