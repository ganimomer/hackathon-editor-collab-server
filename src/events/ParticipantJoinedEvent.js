function ParticipantJoinedEvent({ sessionId, participantId, participantInfo }) {
    this.sessionId = sessionId;
    this.participantId = participantId;
    this.participantInfo = participantInfo;
}

module.exports = ParticipantJoinedEvent;
