const events = require('../events');
const Session = require('../utils/Session');

function getInitialState() {
    return {
        sessions: new Map(),
        socket2session: new Map(),
        // usersToSessions: new Map(),
    };
}

module.exports = function reducer(state = getInitialState(), event) {
    if (event instanceof events.ServerResetEvent) {
        state.sessions = new Map();
        state.socket2session = new Map();
    }

    if (event instanceof events.SessionCreatedEvent) {
        const { sessionId, presenter } = event;
        state.sessions.set(sessionId, new Session({ sessionId, presenter }));
        state.socket2session.set(presenter.id, sessionId);
    }

    if (event instanceof events.SessionAbandonedEvent) {
        const { sessionId } = event;
        const { presenter } = state.sessions.get(sessionId);
        state.socket2session.delete(presenter.id);
        state.sessions.delete(sessionId);
    }

    if (event instanceof events.ParticipantJoiningEvent) {
        const { sessionId, participant } = event;
        const session = state.sessions.get(sessionId);
        session.ghosts.set(participant.id, participant);
        state.socket2session.set(participant.id, sessionId);
    }

    if (event instanceof events.SpectatorLeftEvent) {
        const { sessionId, spectatorId } = event;
        const session = state.sessions.get(sessionId);
        session.spectators.delete(spectatorId);
        state.socket2session.delete(spectatorId);
    }

    if (event instanceof events.GhostDisconnectedEvent) {
        const { sessionId, participantId } = event;
        const session = state.sessions.get(sessionId);
        session.ghosts.delete(participantId);
        state.socket2session.delete(participantId);
    }

    if (event instanceof events.PresenterChangedEvent) {
        const { sessionId, newPresenterId } = event;
        const session = state.sessions.get(sessionId);
        const previousPresenter = session.presenter;

        session.presenter = session.spectators.get(newPresenterId);
        session.spectators.delete(newPresenterId);
        session.spectators.set(previousPresenter.id, previousPresenter);
    }

    if (event instanceof events.GhostBecameSpectatorEvent) {
        const { sessionId, participantId } = event;
        const session = state.sessions.get(sessionId);

        const participant = session.ghosts.get(participantId);
        session.ghosts.delete(participantId);
        session.spectators.set(participantId, participant);
    }

    return state;
};
