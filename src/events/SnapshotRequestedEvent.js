function SnapshotRequestedEvent({ sessionId, spectatorId }) {
    this.sessionId = sessionId;
    this.spectatorId = spectatorId;
}

module.exports = SnapshotRequestedEvent;
