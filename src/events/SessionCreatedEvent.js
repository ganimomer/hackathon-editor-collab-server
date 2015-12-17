function SessionCreatedEvent({ sessionId, presenterId, presenterInfo }) {
    this.sessionId = sessionId;
    this.presenterId = presenterId;
    this.presenterInfo = presenterInfo;
}

module.exports = SessionCreatedEvent;
