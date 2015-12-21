const events = require('./events');

function getInitialState() {
    return {
        sessions: new Map(),
        socket2session: new Map(),
    };
}

module.exports = function reducer(state = getInitialState(), event) {
    if (event instanceof events.ServerResetEvent) {
        state.sessions = new Map();
        state.socket2session = new Map();
    }

    if (event instanceof events.SessionCreatedEvent) {
        const { sessionId, presenter } = event;

        state.sessions.set(sessionId, {
            id: sessionId,
            presenter: presenter,
            spectators: new Map(),
            ghosts: new Map(),
        });

        state.socket2session.set(presenter.id, sessionId);
    }

    if (event instanceof events.SessionAbandonedEvent) {
        const { sessionId } = event;
        const { presenter } = state.sessions.get(sessionId);
        state.socket2session.delete(presenter.id);
        state.sessions.delete(sessionId);
    }

    const session = event.sessionId && state.sessions.get(event.sessionId);

    if (event instanceof events.ParticipantJoiningEvent) {
        const { participant } = event;
        session.ghosts.set(participant.id, participant);
        state.socket2session.set(participant.id, session.id);
    }

    if (event instanceof events.SpectatorLeftEvent) {
        const { spectatorId } = event;

        session.spectators.delete(spectatorId);
        state.socket2session.delete(spectatorId);
    }

    if (event instanceof events.GhostDisconnectedEvent) {
        const { participantId } = event;

        session.ghosts.delete(participantId);
        state.socket2session.delete(participantId);
    }

    if (event instanceof events.PresenterChangedEvent) {
        const { newPresenterId } = event;
        const previousPresenter = session.presenter;

        session.presenter = session.spectators.get(newPresenterId);
        session.spectators.delete(newPresenterId);
        session.spectators.set(previousPresenter.id, previousPresenter);
    }

    if (event instanceof events.GhostBecameSpectatorEvent) {
        const { participantId } = event;
        const participant = session.ghosts.get(participantId);

        session.ghosts.delete(participantId);
        session.spectators.set(participantId, participant);
    }

    return state;
};
