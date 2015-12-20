function Session ({ sessionId, presenter }) {
    this.id = sessionId;
    this.presenter = presenter;
    this.spectators = new Map();
    this.ghosts = new Map();
};

module.exports = Session;
