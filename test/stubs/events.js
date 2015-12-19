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
    SESSION_ABANDONED: () => new events.SessionAbandonedEvent({
        sessionId: SITE(1),
    }),
    PARTICIPANT_JOINED: (i) => new events.ParticipantJoinedEvent({
        sessionId: SITE(1),
        participantId: SOCKET(i),
        participantInfo: PARTICIPANT_INFO(i),
    }),
    PARTICIPANT_LEFT: (i) => new events.ParticipantLeftEvent({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    }),
    SNAPSHOT_REQUESTED: i => (new events.SnapshotRequestedEvent({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    })),
    SNAPSHOT_SENT: () => (new events.SnapshotSentEvent({
        sessionId: SITE(1),
    })),
    PRESENTER_CHANGED: (i) => {
        return new events.PresenterChangedEvent({
            sessionId: SITE(1),
            newPresenterId: SOCKET(i),
        });
    },
};
