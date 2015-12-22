const events = require('../../src/events');
const {
    SITE, SOCKET, PARTICIPANT_DETAILS,
} = require('./constants');

module.exports = {
    INITIALIZE: {},
    SERVER_RESET: () => new events.ServerResetEvent(),
    SESSION_CREATED: i => new events.SessionCreatedEvent({
        sessionId: SITE(i),
        presenter: PARTICIPANT_DETAILS(i),
    }),
    SESSION_ABANDONED: () => new events.SessionAbandonedEvent({
        sessionId: SITE(1),
    }),
    PARTICIPANT_JOINING: (i) => new events.ParticipantJoiningEvent({
        sessionId: SITE(1),
        participant: PARTICIPANT_DETAILS(i),
    }),
    SPECTATOR_LEFT: (i) => new events.SpectatorLeftEvent({
        sessionId: SITE(1),
        spectatorId: SOCKET(i),
    }),
    GHOST_BECAME_SPECTATOR: i => (new events.GhostBecameSpectatorEvent({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    })),
    GHOST_DISCONNECTED: i => (new events.GhostDisconnectedEvent({
        sessionId: SITE(1),
        participantId: SOCKET(i),
    })),
    PRESENTER_CHANGED: (i) => {
        return new events.PresenterChangedEvent({
            sessionId: SITE(1),
            newPresenterId: SOCKET(i),
        });
    },
};
