const events = require('../events');

const commands = {
    requestSnapshot(dispatch, getState, api, command) {
        const { sessionId, participantId } = command;
        const { sessions } = getState();
        const session = sessions.get(sessionId);

        if (session) {
            api.requestSnapshot({ presenterId: session.presenterId, });
            // const socket = api.getSocket(session.presenterId);
            // socket.emit('request-history', { });
        }
    },
    sendSnapshot(dispatch, getState, api, command) {
    },
    addParticipant(dispatch, getState, api, command) {
        const { sessionId, participantId, info } = command;

        if (!sessionId) {
            return;
        }

        const { sessions } = getState();

        if (sessions.has(sessionId)) {
            dispatch(new events.ParticipantJoinedEvent({
                sessionId,
                participantId,
                participantInfo: info
            }));

            commands.requestSnapshot({ sessionId, participantId });
        } else {
            dispatch(new events.SessionCreatedEvent({
                sessionId,
                presenterId: participantId,
                presenterInfo: presenterInfo,
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
