const events = require('../events');
const Session = require('../utils/Session');

function getInitialState() {
    return {
        sessions: new Map(),
    };
}

module.exports = function reducer(state = getInitialState(), event) {
    if (event instanceof events.ServerResetEvent) {
        state.sessions = new Map();
    }

    if (event instanceof events.SessionCreatedEvent) {
        const { sessionId, presenterId } = event;
        state.sessions.set(sessionId, new Session({ sessionId, presenterId }));
    }

    if (event instanceof events.ParticipantJoinedEvent) {
        const { sessionId, participantId } = event;
        const session = state.sessions.get(sessionId);
        session.participants.add(participantId);
    }

    if (event instanceof events.ParticipantLeftEvent) {
        const { sessionId, participantId } = event;
        const session = state.sessions.get(sessionId);
        session.participants.delete(participantId);
    }

    if (event instanceof events.SnapshotRequestedEvent) {
        const { sessionId, participantId } = event;
        const session = state.sessions.get(sessionId);
        session.waitingSnapshot.add(participantId);
    }

    if (event instanceof events.SnapshotSentEvent) {
        const { sessionId } = event;
        const session = state.sessions.get(sessionId);
        session.waitingSnapshot.clear();
    }

    return state;
};
