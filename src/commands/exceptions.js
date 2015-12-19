function InvalidCommandException(command, reason) {
    this.command = command;
    this.reason = reason;
}

function AccessDeniedException(command, reason) {
    this.command = command;
    this.reason = reason;
}

function MissingSessionException(sessionId) {
    this.sessionId = sessionId;
}

module.exports = {
    AccessDeniedException,
    InvalidCommandException,
    MissingSessionException,
};
