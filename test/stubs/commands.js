const {
    SITE, SOCKET, PARTICIPANT_INFO, SNAPSHOT
} = require('./constants');

module.exports = {
    ADD_PARTICIPANT: i => ({
        sessionId: SITE(1),
        participantId: SOCKET(i),
        participantInfo: PARTICIPANT_INFO(i),
    }),
    REQUEST_SNAPSHOT: i => ({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    }),
    SEND_SNAPSHOT: (i) => ({
        sessionId: SITE(1),
        presenterId: SOCKET(i),
        snapshot: SNAPSHOT(1, i),
    }),
    REMOVE_PARTICIPANT: i => ({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    }),
};
