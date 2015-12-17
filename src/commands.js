class Commands {
    constructor({ network }) {
        // this._network = network;
        this.sessions = {};
    }
    connect({ userId, siteId }) {
    }
}

module.exports = Commands;
/*
{
    createInitialState() {
        return { sessions: {} };
    },
    connect(state, ) {
        if (Math.random() > 0.5) {
            this.createSessionWithPresenter();
        } else {
            this.addParticipantToSession();
        }
    },

    //addUserToEditingSession: function (state, }
};
*/
