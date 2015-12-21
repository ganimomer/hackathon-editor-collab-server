module.exports = {
    InvalidCommandException(command, reason) {
        this.command = command;
        this.reason = reason;
    },
    AccessDeniedException(issuerId, reason) {
        this.issuerId = issuerId;
        this.reason = reason;
    },
    UnknownSpectatorException(spectatorId) {
        this.spectatorId = spectatorId;
    },
    ParticipantShouldNotWaitSnapshotException(sessionId, participantId) {
        this.sessionId = sessionId;
        this.participantId = participantId;
    },
    EmptySessionException(sessionId) {
        this.sessionId = sessionId;
    },
    MissingSessionException(sessionId) {
        this.sessionId = sessionId;
    },
    EmptySessionPointerException(issuerId) {
        this.issuerId = issuerId;
    },
    UnregisteredIssuerException(issuerId) {
        this.issuerId = issuerId;
    },
};
