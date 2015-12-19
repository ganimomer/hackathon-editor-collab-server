function notImplemented() {
    throw 'not implemented';
}

module.exports = {
    requestSnapshot({ presenterId }) {
        notImplemented();
    },
    sendSnapshot({ participantId, history }) {
        notImplemented();
    },
    sendSessionRights({ participantId, isPresenter }) {
        notImplemented();
    },
};
