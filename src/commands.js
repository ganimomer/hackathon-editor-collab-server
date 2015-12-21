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

const commands = {
    sendSnapshot(dispatch, getState, api, command) {
        const { issuerId, snapshot } = command;
        const { id: sessionId, presenter, ghosts: _ghosts, spectators } = getSession(getState(), issuerId);

        if (issuerId === presenter.id) {
            const ghosts = Array.from(_ghosts.values());

            const ghostsMap = _.transform(ghosts, transformIntoParticipantsMap, {});

            const participantsMap = _.transform(
                [presenter, ...spectators, ...ghosts],
                transformIntoParticipantsMap,
                {}
            );

            ghosts.forEach(ghost => {
                api.sendSession({ to: ghost.id }, {
                    id: ghost.id,
                    presenterId: presenter.id,
                    participants: participantsMap,
                    snapshot,
                });

                dispatch(new events.GhostBecameSpectatorEvent({
                    sessionId: sessionId,
                    participantId: ghost.id,
                }))
            });

            api.announceNewSpectators({
                broadcastTo: sessionId,
                except: _.pluck(ghosts, 'id')
            }, ghostsMap);
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

        if (session.presenter.id === participantId) {
            if (session.spectators.size === 0) {
                session.ghosts.forEach(({ id }) => {
                    this.disconnectGhost({ ghostId: id, isForce: true });
                });

                return dispatch(new events.SessionAbandonedEvent({
                    sessionId: session.id,
                })); // NOTE: emergency exit branch
            } else {
                let newPresenter = session.spectators.values().next().value;

                this.transferPresentership({
                    newPresenterId: newPresenter.id,
                    issuerId: session.presenter.id,
                });
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
    transferPresentership(dispatch, getState, api, { newPresenterId, issuerId }) {
        const session = getSession(getState(), issuerId);

        if (session.presenter.id === issuerId) {
            if (session.spectators.has(newPresenterId)) {
                dispatch(new events.PresenterChangedEvent({
                    sessionId: session.id,
                    newPresenterId: newPresenterId,
                }));

                api.announcePresenterChanged(
                    { broadcastTo: session.id },
                    { presenterId: newPresenterId }
                );
            } else {
                throw new exceptions.UnknownSpectatorException(newPresenterId);
            }
        } else {
            throw new exceptions.AccessDeniedException(issuerId, 'is not a presenter');
        }
    },
    disconnectSpectator(dispatch, getState, api, { spectatorId }) {
        const session = getSession(getState(), spectatorId);

        api.announceLeavingSpectator(
            { broadcastTo: session.id, except: spectatorId },
            { spectatorId }
        );

        dispatch(new events.SpectatorLeftEvent({
            sessionId: session.id,
            spectatorId
        }));
    },
    disconnectGhost(dispatch, getState, api, { ghostId, isForce = false }) {
        const session = getSession(getState(), ghostId);

        if (isForce) {
            api.announceLeavingSpectator({ to: ghostId }, {
                spectatorId: session.presenter.id,
            });
        }

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
};

module.exports = commands;
