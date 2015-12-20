function GhostBecameSpectatorEvent({ sessionId, participantId }) {
    this.sessionId = sessionId;
    this.participantId = participantId;
}

module.exports = GhostBecameSpectatorEvent;
