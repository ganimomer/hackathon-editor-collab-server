function GhostDisconnectedEvent({ sessionId, participantId }) {
    this.sessionId = sessionId;
    this.participantId = participantId;
}

module.exports = GhostDisconnectedEvent;
