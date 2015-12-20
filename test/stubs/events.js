const events = require('../../src/events');
const {
    SITE, SOCKET, PARTICIPANT_DETAILS,
} = require('./constants');

module.exports = {
    INITIALIZE: {},
    SERVER_RESET: () => new events.ServerResetEvent(),
    SESSION_CREATED: new events.SessionCreatedEvent({
        sessionId: SITE(1),
        presenter: PARTICIPANT_DETAILS(1),
    }),
    SESSION_ABANDONED: () => new events.SessionAbandonedEvent({
        sessionId: SITE(1),
    }),
    SPECTATOR_JOINED: (i) => new events.SpectatorJoinedEvent({
        sessionId: SITE(1),
        spectator: PARTICIPANT_DETAILS(i),
    }),
    SPECTATOR_LEFT: (i) => new events.SpectatorLeftEvent({
        sessionId: SITE(1),
        spectatorId: SOCKET(i),
    }),
    SNAPSHOT_REQUESTED: i => (new events.SnapshotRequestedEvent({
        sessionId: SITE(1),
        spectatorId: SOCKET(i),
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
