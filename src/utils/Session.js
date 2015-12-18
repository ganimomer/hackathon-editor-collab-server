function Session ({ sessionId, presenterId }) {
    this.id = sessionId;
    this.presenterId = presenterId;
    this.participants = new Set();
    this.participants.add(presenterId);
    this.waitingSnapshot = new Set();
};

module.exports = Session;
