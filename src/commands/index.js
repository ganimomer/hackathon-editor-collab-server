const events = require('../events');
const exceptions = require('./exceptions');

const commands = {
    requestSnapshot(dispatch, getState, api, command) {
        const { sessionId, participantId } = command;
        const { sessions } = getState();
        const session = sessions.get(sessionId);

        if (session) {
            dispatch(new events.SnapshotRequestedEvent({ sessionId, participantId }));
            api.requestSnapshot({ presenterId: session.presenterId });
        } else {
            throw new exceptions.MissingSessionException(sessionId);
        }
    },
    sendSnapshot(dispatch, getState, api, command) {
        const { sessionId, presenterId, snapshot } = command;
        const { sessions } = getState();
        const session = sessions.get(sessionId);

        if (session && presenterId === session.presenterId) {
            session.waitingSnapshot.forEach(participantId => {
                api.sendSnapshot({
                    participantId,
                    history: command.snapshot
                });
            });

            dispatch(new events.SnapshotSentEvent({ sessionId }));
        } else {
            throw new exceptions.MissingSessionException(sessionId);

            if (session && presenterId === session.presenterId) {
                throw new exception.AccessDeniedException(command, 'is not a presenter');
            }
        }
    },
    addParticipant(dispatch, getState, api, command) {
        const { sessionId, participantId, participantInfo } = command;
        if (!sessionId) { return console.error('no session id'); }

        const { sessions } = getState();

        if (sessions.has(sessionId)) {
            dispatch(new events.ParticipantJoinedEvent({
                sessionId,
                participantId,
                participantInfo,
            }));

            this.requestSnapshot({ sessionId, participantId });
        } else {
            dispatch(new events.SessionCreatedEvent({
                sessionId,
                presenterId: participantId,
                presenterInfo: participantInfo,
            }));
        }
    },
    removeParticipant(dispatch, getState, api, command) {
        const { sessionId, participantId } = command;
        const { sessions } = getState();

        if (sessions.has(sessionId)) {
            const session = sessions.get(sessionId);

            if (session.presenterId === participantId) {
                let newPresenterId;

                for (let aParticipantId of session.participants) {
                    if (aParticipantId !== participantId) {
                        newPresenterId = aParticipantId;
                        break;
                    }
                }

                if (newPresenterId) {
                    dispatch(new events.PresenterChangedEvent({
                        sessionId,
                        newPresenterId,
                    }));

                    dispatch(new events.ParticipantLeftEvent({
                        sessionId,
                        participantId,
                    }));

                    api.sendSessionRights({
                        participantId: newPresenterId,
                        isPresenter: true,
                    });
                } else {
                    dispatch(new events.SessionAbandonedEvent({
                        sessionId,
                    }));
                }
            } else {
                dispatch(new events.ParticipantLeftEvent({
                    sessionId,
                    participantId,
                }));
            }
        } else {
            throw new exceptions.MissingSessionException(sessionId);
        }
    },
    broadcastToSpectators(dispatch, getState, api, command) {
    },
    transferPresenterRightsTo(dispatch, getState, api, command) {
    },
};

module.exports = commands;
