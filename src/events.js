module.exports = {
    ServerResetEvent() { },
    SessionCreatedEvent({ sessionId, presenter }) {
        this.sessionId = sessionId;
        this.presenter = presenter;
    },
    SessionAbandonedEvent({ sessionId, presenterId }) {
        this.sessionId = sessionId;
        this.presenterId = presenterId;
    },
    ParticipantJoiningEvent({ sessionId, participant }) {
        this.sessionId = sessionId;
        this.participant = participant;
    },
    GhostBecameSpectatorEvent({ sessionId, participantId }) {
        this.sessionId = sessionId;
        this.participantId = participantId;
    },
    GhostDisconnectedEvent({ sessionId, participantId }) {
        this.sessionId = sessionId;
        this.participantId = participantId;
    },
    SpectatorLeftEvent({ sessionId, spectatorId }) {
        this.sessionId = sessionId;
        this.spectatorId = spectatorId;
    },
    PresenterChangedEvent({ sessionId, newPresenterId }) {
        this.sessionId = sessionId;
        this.newPresenterId = newPresenterId;
    },
};
