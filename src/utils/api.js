const _ = require('lodash');

function notImplemented() {
    throw 'not implemented';
}

function requestSnapshot(socket, { presenterId }) {
    notImplemented();
}

function sendSnapshot(socket, { history }) {
    notImplemented();
}

function announcePresenter(socket, { presenter }) {
    notImplemented();
}

function announceSpectators(socket, { spectators }) {
    notImplemented();
}

function announceNewSpectators(socket, { spectatorIds }) {
    notImplemented();
}

function announceExitingSpectators(socket, { spectators }) {
    notImplemented();
}

function resolveSockets(io, socket, state, { to, except, broadcastTo }) {
    // to = _.isArray(to) ? to : [to];
    // broadcastTo = _.isArray(broadcastTo) ? broadcastTo : [broadcastTo];
    // except = _.isArray(except) ? except : [except];
    return [];
}

function wrap(fn) {
    return function routeWrapped(routeInfo, message) {
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
    sendSnapshot: wrap(sendSnapshot),
    announcePresenter: wrap(announcePresenter),
    announceSpectators: wrap(announceSpectators),
    announceNewSpectators: wrap(announceNewSpectators),
    announceExitingSpectators: wrap(announceExitingSpectators),
};

module.exports = NetworkAPI;
