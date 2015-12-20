function Session ({ sessionId, presenter }) {
    this.id = sessionId;
    this.presenter = presenter;
    this.spectators = new Map();
    this.waitingSnapshot = new Set();
};

module.exports = Session;
