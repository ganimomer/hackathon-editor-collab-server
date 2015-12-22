const _ = require('lodash');
const events = require('./events');
const exceptions = require('./exceptions');

function getSessionId(socket2session, issuerId) {
    if (!socket2session.has(issuerId)) {
        throw new exceptions.UnregisteredIssuerException(issuerId);
    }

    const sessionId = socket2session.get(issuerId);

    if (!sessionId) {
        throw new exceptions.EmptySessionPointerException(issuerId);
    }

    return sessionId;
}

function getSession(state, issuerId) {
    const { sessions, socket2session } = state;
    const sessionId = getSessionId(socket2session, issuerId);

    if (!sessions.has(sessionId)) {
        throw new exceptions.MissingSessionException(sessionId);
    }

    const session = sessions.get(sessionId);

    if (!session) {
        throw new exceptions.EmptySessionException(sessionId);
    }

    return session;
}

function transformIntoParticipantsMap(acc, { id, email }) {
    acc[id] = email;
}

function transformSessionIntoClientSession(session, snapshot) {
    const participants = [session.presenter, ...session.spectators.values()];

    let obj = {
        presenterId: session.presenter.id,
        participants: _.transform(participants, transformIntoParticipantsMap, {}),
    };

    if (snapshot) {
        obj.snapshot = snapshot;
    }

    return obj;
}

const commands = {
    sendSnapshot(dispatch, getState, api, command) {
        const { issuerId, snapshot } = command;
        const session = getSession(getState(), issuerId);
        const { presenter } = session;

        if (issuerId === presenter.id) {
            const ghostsIds = _.pluck([...session.ghosts.values()], 'id');
            ghostsIds.forEach(ghostId => {
                dispatch(new events.GhostBecameSpectatorEvent({
                    sessionId: session.id,
                    participantId: ghostId,
                }))
            });

            api.sendSession(
                { to: ghostsIds },
                transformSessionIntoClientSession(session, snapshot)
            );

            api.sendSession(
                { broadcastTo: session.id, except: ghostsIds },
                transformSessionIntoClientSession(session)
            );
        } else {
            throw new exceptions.AccessDeniedException(issuerId, 'is not a presenter');
        }
    },
    handleJoinRequest(dispatch, getState, api, command) {
        const { sessionId, participant } = command;
        // if (!sessionId) { return console.error('no session id'); }

        const { sessions, socket2session } = getState();
        const session = sessions.get(sessionId);

        if (socket2session.has(participant.id)) {
            throw 'something weird';
        }

        if (session) {
            dispatch(new events.ParticipantJoiningEvent({
                sessionId,
                participant,
            }));

            api.requestSnapshot({ to: session.presenter.id });
        } else {
            dispatch(new events.SessionCreatedEvent({
                sessionId,
                presenter: participant,
            }));

            api.sendSession(
                { to: participant.id },
                {
                    id: participant.id,
                    presenterId: participant.id,
                    participants: {
                        [participant.id]: participant.email,
                    },
                }
            );
        }
    },
    disconnectParticipant(dispatch, getState, api, { participantId }) {
        const session = getSession(getState(), participantId);
        const presenterId = session.presenter.id;

        if (presenterId === participantId) {
            const ghostsIds = [...session.ghosts.keys()];

            if (session.spectators.size === 0) {
                if (ghostsIds.length === 0) {
                    return this.abandonSession({ sessionId: session.id });
                } else {
                    ghostsIds.forEach(id => {
                        dispatch(new events.GhostBecameSpectatorEvent({
                            sessionId: session.id,
                            participantId: id,
                        }));
                    });

                    dispatch(new events.PresenterChangedEvent({
                        sessionId: session.id,
                        newPresenterId: ghostsIds[0],
                    }));
                }
            } else {
                let newPresenter = session.spectators.values().next().value;

                dispatch(new events.PresenterChangedEvent({
                    sessionId: session.id,
                    newPresenterId: newPresenter.id,
                }));

                if (ghostsIds.length > 0) {
                    api.requestSnapshot({ to: newPresenter.id });
                }
            }
        }

        if (session.spectators.has(participantId)) {
            this.disconnectSpectator({ spectatorId: participantId });
        } else if (session.ghosts.has(participantId)) {
            this.disconnectGhost({ ghostId: participantId });
        } else {
            throw 'something weird in disconnection';
        }
    },
    abandonSession(dispatch, getState, api, { sessionId }) {
        const { sessions } = getState();

        if (sessions.has(sessionId)) {
            dispatch(new events.SessionAbandonedEvent({ sessionId }));
        } else {
            throw new exceptions.MissingSessionException(sessionId);
        }
    },
    transferPresentership(dispatch, getState, api, { newPresenterId, issuerId }) {
        const session = getSession(getState(), issuerId);

        if (session.presenter.id === issuerId) {
            if (session.spectators.has(newPresenterId)) {
                dispatch(new events.PresenterChangedEvent({
                    sessionId: session.id,
                    newPresenterId: newPresenterId,
                }));

                api.sendSession(
                    { broadcastTo: session.id },
                    transformSessionIntoClientSession(session)
                );
            } else {
                throw new exceptions.UnknownSpectatorException(newPresenterId);
            }
        } else {
            throw new exceptions.AccessDeniedException(issuerId, 'is not a presenter');
        }
    },
    takePresentership(dispatch, getState, api, { issuerId }) {
        const session = getSession(getState(), issuerId);

        if (session.spectators.has(issuerId)) {
            dispatch(new events.PresenterChangedEvent({
                sessionId: session.id,
                newPresenterId: issuerId,
            }));

            api.sendSession(
                { broadcastTo: session.id },
                transformSessionIntoClientSession(session)
            );
        } else {
            throw new exceptions.UnknownSpectatorException(issuerId);
        }
    },
    disconnectSpectator(dispatch, getState, api, { spectatorId }) {
        const session = getSession(getState(), spectatorId);

        dispatch(new events.SpectatorLeftEvent({
            sessionId: session.id,
            spectatorId
        }));

        api.sendSession(
            { broadcastTo: session.id },
            transformSessionIntoClientSession(session)
        );
    },
    disconnectGhost(dispatch, getState, api, { ghostId }) {
        const session = getSession(getState(), ghostId);

        dispatch(new events.GhostDisconnectedEvent({
            sessionId: session.id,
            participantId: ghostId,
        }));
    },
    broadcastChange(dispatch, getState, api, { issuerId, change }) {
        const session = getSession(getState(), issuerId);

        if (session.presenter.id === issuerId) {
            api.broadcastChange(
                { broadcastTo: session.id, except: session.presenter.id },
                change
            );
        } else {
            throw new exceptions.AccessDeniedException(issuerId, 'is not a presenter');
        }
    },
    broadcastChat(dispatch, getState, api, { issuerId, message }) {
        const session = getSession(getState(), issuerId);

        if (session.presenter.id === issuerId || session.spectators.has(issuerId)) {
            api.broadcastChat(
                { broadcastTo: session.id, except: issuerId },
                { participantId: issuerId, message }
            );
        } else {
            throw new exceptions.AccessDeniedException(issuerId, 'is a ghost');
        }
    },
    requestControl(dispatch, getState, api, { issuerId }) {
        const session = getSession(getState(), issuerId);

        if (session.spectators.has(issuerId)) {
            api.informControlRequested(
                { to: session.presenter.id },
                { spectatorId: issuerId }
            );
        } else {
            throw new exceptions.UnknownSpectatorException(issuerId);
        }
    },
    denyControl(dispatch, getState, api, { issuerId, spectatorId }) {
        const session = getSession(getState(), issuerId);

        if (session.presenter.id === issuerId) {
            if (session.spectators.has(spectatorId)) {
                api.informControlDenied({ to: spectatorId });
            } else {
                throw new exceptions.UnknownSpectatorException(spectatorId);
            }
        } else {
            throw new exceptions.AccessDeniedException(issuerId, 'is not a presenter');
        }
    },
};

module.exports = commands;
