function SnapshotRequestedEvent({ sessionId, participantId }) {
    this.sessionId = sessionId;
    this.participantId = participantId;
}

module.exports = SnapshotRequestedEvent;
