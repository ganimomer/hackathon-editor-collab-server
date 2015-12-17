const { expect } = require('chai');
const Commands = require('../src/commands');

describe('Commands', () => {
    let facade = null;
    let commands = null;

    beforeEach(() => {
        commands = new Commands({ facade });
    });

    it('has sessions in an initial state', function () {
        expect(commands.sessions).to.be.ok;
    });


    // describe('connect', () => {
    //     it('creates a new session if it is a first user for the site', () => {
    //         const [newUserId, newSiteId] = ['newUserId', 'newSiteId'];
    //         spyOn commands.createNewSession
    //         commands.attachUserToEditingSession(state, facade, { userId, siteId })
    //         expect(commands.createNewSession).to.haveBeenCalled
    //         expect(commands.attachToExistingSession).not.to.haveBeenCalled
    //     });

    //     it('attaches user as a participant if site is exis session if it is a existing user on the site', () => {
    //         const [newUserId, existingSiteId] = ['newUserId', 'existingSiteId'];
    //         state.sessions[existingSiteId] = { }

    //         spyOn commands.createNewSession
    //         commands.attachUserToEditingSession(state, facade, { userId, siteId })
    //         expect(commands.createNewSession).to.haveBeenCalled
    //         expect(commands.attachToExistingSession).not.to.haveBeenCalled
    //     });
    // });
});
