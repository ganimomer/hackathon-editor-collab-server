const events = require('../events');
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

const commands = {
    requestSnapshot(dispatch, getState, api, command) {
        const { issuerId } = command;
        const session = getSession(getState(), issuerId);

        if (session.spectators.has(issuerId)) {
            dispatch(new events.SnapshotRequestedEvent({
                sessionId: session.id,
                spectatorId: issuerId
            }));

            api.requestSnapshot({ to: session.presenter.id });
        } else {
           throw new exceptions.IssuerIsNotSpectatorException(session.id, issuerId);
        }
    },
    sendSnapshot(dispatch, getState, api, command) {
        const { sessionId, issuerId, snapshot } = command;
        const session = getSession(getState(), issuerId);

        if (issuerId === session.presenter.id) {
            const spectatorsIds = Array.from(session.waitingSnapshot.values());

            api.sendSnapshot({ to: spectatorsIds }, { snapshot });
            dispatch(new events.SnapshotSentEvent({ sessionId }));
        } else {
            throw new exceptions.AccessDeniedException(command, 'is not a presenter');
        }
    },
    addParticipant(dispatch, getState, api, command) {
        const { sessionId, participant } = command;
        if (!sessionId) { return console.error('no session id'); }

        const { sessions } = getState();
        const session = sessions.get(sessionId);

        if (session) {
            const spectatorsPlusNewbie = Array.from(session.spectators.values()).concat([participant]);

            dispatch(new events.SpectatorJoinedEvent({
                sessionId,
                spectator: participant,
            }));

            api.announcePresenter({ to: participant.id }, {
                presenter: session.presenter,
            });

            api.announceSpectators({ to: participant.id }, {
                spectators: spectatorsPlusNewbie,
            });

            api.announceNewSpectators({
                broadcastTo: sessionId,
                except: participant.id,
            }, {
                spectators: [participant],
            });

            this.requestSnapshot({ sessionId, spectatorId: participant.id });
        } else {
            dispatch(new events.SessionCreatedEvent({
                sessionId,
                presenter: participant,
            }));

            api.announcePresenter(
                { to: participant.id },
                { presenter: participant }
            );

            api.announceSpectators(
                { to: participant.id },
                { spectators: [] }
            );
        }
    },
    removeParticipant(dispatch, getState, api, command) {
        const { sessionId, participantId } = command;
        const { sessions } = getState();

        if (!sessions.has(sessionId)) {
            throw new exceptions.MissingSessionException(sessionId);
        }

        const session = sessions.get(sessionId);

        if (session.presenter.id === participantId) {
            if (session.spectators.size === 0) {
                return dispatch(new events.SessionAbandonedEvent({
                    sessionId,
                })); // NOTE: emergency exit branch
            } else {
                let newPresenter = session.spectators.values().next().value;

                this.transferPresentership({
                    sessionId,
                    newPresenterId: newPresenter.id,
                    requesterId: session.presenter.id,
                });
            }
        }

        this.removeSpectator({
            sessionId,
            spectatorId: participantId,
        });
    },
    removeSpectator(dispatch, getState, api, command) {
        const { sessionId, spectatorId } = command;
        const { sessions } = getState();

        if (!sessions.has(sessionId)) {
            throw new exceptions.MissingSessionException(sessionId);
        }

        api.announceExitingSpectators(
            { broadcastTo: sessionId, except: spectatorId },
            { spectatorIds: [spectatorId] }
        );

        dispatch(new events.SpectatorLeftEvent({
            sessionId,
            spectatorId
        }));
    },
    // broadcastToSpectators(dispatch, getState, api, command) {
    // },
    // transferPresentership(dispatch, getState, api, command) {
    // },
};

module.exports = commands;
