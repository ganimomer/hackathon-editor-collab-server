function InvalidCommandException(command, reason) {
    this.command = command;
    this.reason = reason;
}

function AccessDeniedException(issuerId, reason) {
    this.issuerId = issuerId;
    this.reason = reason;
}

function UnknownSpectatorException(spectatorId) {
    this.spectatorId = spectatorId;
}

function ParticipantShouldNotWaitSnapshotException(sessionId, participantId) {
    this.sessionId = sessionId;
    this.participantId = participantId;
}

function EmptySessionException(sessionId) {
    this.sessionId = sessionId;
}

function MissingSessionException(sessionId) {
    this.sessionId = sessionId;
}

function EmptySessionPointerException(issuerId) {
    this.issuerId = issuerId;
}

function UnregisteredIssuerException(issuerId) {
    this.issuerId = issuerId;
}

module.exports = {
    InvalidCommandException,
    AccessDeniedException,
    UnknownSpectatorException,
    ParticipantShouldNotWaitSnapshotException,
    EmptySessionException,
    MissingSessionException,
    EmptySessionPointerException,
    UnregisteredIssuerException,
};
