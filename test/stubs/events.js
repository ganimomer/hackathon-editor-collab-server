const events = require('../../src/events');
const {
    SITE, SOCKET, PARTICIPANT_INFO
} = require('./constants');

module.exports = {
    INITIALIZE: {},
    SESSION_CREATED: new events.SessionCreatedEvent({
        sessionId: SITE(1),
        presenterId: SOCKET(1),
        presenterInfo: PARTICIPANT_INFO(1),
    }),
    PARTICIPANT_JOINED: new events.ParticipantJoinedEvent({
        sessionId: SITE(1),
        participantId: SOCKET(2),
        participantInfo: PARTICIPANT_INFO(2),
    }),
    SNAPSHOT_REQUESTED: i => (new events.SnapshotRequestedEvent({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    })),
};
