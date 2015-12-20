function InvalidCommandException(command, reason) {
    this.command = command;
    this.reason = reason;
}

function AccessDeniedException(command, reason) {
    this.command = command;
    this.reason = reason;
}

function UnregisteredIssuerException(issuerId) {
    this.issuerId = issuerId;
}

function IssuerIsNotSpectatorException(sessionId, spectatorId) {
    this.sessionId = sessionId;
    this.spectatorId = spectatorId;
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
    UnregisteredIssuerException,
    IssuerIsNotSpectatorException,
    EmptySessionException,
    MissingSessionException,
    EmptySessionPointerException,
    UnregisteredIssuerException,
};
