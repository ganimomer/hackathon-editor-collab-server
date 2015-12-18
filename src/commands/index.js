const events = require('../events');

const commands = {
    requestSnapshot(dispatch, getState, api, command) {
        const { sessionId, participantId } = command;
        const { sessions } = getState();
        const session = sessions.get(sessionId);

        if (session) {
            dispatch(new events.SnapshotRequestedEvent({ sessionId, participantId }));
            api.requestSnapshot({ presenterId: session.presenterId });
        } else {
            console.error('session', sessionId, 'does not exist');
        }
    },
    sendSnapshot(dispatch, getState, api, command) {
        const { sessionId, presenterId } = command;
        const { sessions } = getState();
        const session = sessions.get(sessionId);

        if (session && presenterId === session.presenterId) {
            session.waitingSnapshot.forEach(participantId => {
                const promise = api.sendSnapshot({ participantId, snapshot: command.snapshot });
                promise.then(() => dispatch(new SnapshotDeliveredEvent(sessionId, participantId)));
            });
        } else {
            if (!session) {
                console.error('session', sessionId, 'does not exist');
            }

            if (session && presenterId === session.presenterId) {
                console.error('invalid participant', participantId, 'tried to mimick', presenterId);
            }
        }
    },
    addParticipant(dispatch, getState, api, command) {
        const { sessionId, participantId, participantInfo } = command;

        if (!sessionId) {
            return;
        }

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
    },
    broadcastToSpectators(dispatch, getState, api, command) {
    },
    transferPresenterRightsTo(dispatch, getState, api, command) {
    },
};

module.exports = commands;
