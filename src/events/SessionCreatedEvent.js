function SessionCreatedEvent({ sessionId, presenter }) {
    this.sessionId = sessionId;
    this.presenter = presenter;
}

module.exports = SessionCreatedEvent;
