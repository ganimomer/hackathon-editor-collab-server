const {
    SITE, SOCKET, PARTICIPANT_DETAILS, SNAPSHOT
} = require('./constants');

module.exports = {
    ADD_PARTICIPANT: i => ({
        sessionId: SITE(1),
        participant: PARTICIPANT_DETAILS(i),
    }),
    SEND_SNAPSHOT: i => ({
        issuerId: SOCKET(i),
        snapshot: SNAPSHOT(1, i),
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
    REMOVE_PARTICIPANT: i => ({
        participantId: SOCKET(i),
    }),
    REQUEST_SNAPSHOT: i => ({
        issuerId: SOCKET(i),
    }),
    REMOVE_SPECTATOR: i => ({
        spectatorId: SOCKET(i),
    }),
};
