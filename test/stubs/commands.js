const {
    SITE, SOCKET, PARTICIPANT_DETAILS, SNAPSHOT
} = require('./constants');

module.exports = {
    HANDLE_JOIN_REQUEST: i => ({
        sessionId: SITE(1),
        participant: PARTICIPANT_DETAILS(i),
    }),
    SEND_SNAPSHOT: i => ({
        issuerId: SOCKET(i),
        snapshot: SNAPSHOT(),
    }),
    BROADCAST_CHANGE: i => ({
        issuerId: SOCKET(i),
        change: 'change from ' + i,
    }),
    BROADCAST_MESSAGE: i => ({
        issuerId: SOCKET(i),
        change: 'message from ' + i,
    }),
    REQUEST_CONTROL: i => ({
        issuerId: SOCKET(i),
    }),
    TRANSFER_PRESENTERSHIP: (i, j) => ({
        issuerId: SOCKET(i),
        newPresenterId: SOCKET(j),
    }),
    DENY_CONTROL: (i, j) => ({
        issuerId: SOCKET(i),
        spectatorId: SOCKET(j),
    }),
    DISCONNECT_PARTICIPANT: i => ({
        participantId: SOCKET(i),
    }),
    REQUEST_SNAPSHOT: i => ({
        participantId: SOCKET(i),
    }),
    DISCONNECT_SPECTATOR: i => ({
        spectatorId: SOCKET(i),
    }),
    DISCONNECT_GHOST: (i, force) => ({
        ghostId: SOCKET(i),
        isForce: force,
    }),
};
