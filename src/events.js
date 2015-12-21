function ServerResetEvent() { }

function SessionCreatedEvent({ sessionId, presenter }) {
    this.sessionId = sessionId;
    this.presenter = presenter;
}

function SessionAbandonedEvent({ sessionId }) {
    this.sessionId = sessionId;
}

function ParticipantJoiningEvent({ sessionId, participant }) {
    this.sessionId = sessionId;
    this.participant = participant;
}

function GhostBecameSpectatorEvent({ sessionId, participantId }) {
    this.sessionId = sessionId;
    this.participantId = participantId;
}

function GhostDisconnectedEvent({ sessionId, participantId }) {
    this.sessionId = sessionId;
    this.participantId = participantId;
}

function SpectatorLeftEvent({ sessionId, spectatorId }) {
    this.sessionId = sessionId;
    this.spectatorId = spectatorId;
}

function PresenterChangedEvent({ sessionId, newPresenterId }) {
    this.sessionId = sessionId;
    this.newPresenterId = newPresenterId;
}

module.exports = {
    ServerResetEvent,
    SessionCreatedEvent,
    SessionAbandonedEvent,
    ParticipantJoiningEvent,
    GhostBecameSpectatorEvent,
    GhostDisconnectedEvent,
    SpectatorLeftEvent,
    PresenterChangedEvent,
};
