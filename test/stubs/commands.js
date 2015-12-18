const {
    SITE, SOCKET, PARTICIPANT_INFO
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
    })
};
