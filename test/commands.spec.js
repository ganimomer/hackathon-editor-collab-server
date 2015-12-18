const _ = require('lodash');
const chai = require('chai');
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const events = require('../src/events');
const reducer = require('../src/reducers/index');
const commandsModule = require('../src/commands');

const stub = {
    api: require('./stubs/api'),
    constants: require('./stubs/constants'),
    commands: require('./stubs/commands'),
    events: require('./stubs/events'),
};

describe('commands', () => {
    let state;
    let eventsQueue;
    let dispatch;
    let commands;
    const api = stub.api;

    beforeEach(() => {
        eventsQueue = [];
        dispatch = e => eventsQueue.push(e);
        state = reducer(undefined, stub.events.INITIALIZE);
        commands = _.mapValues(commandsModule, fn => _.curry(fn)(dispatch, () => state, api));
    });

    it('has sessions in an initial state', function () {
        expect(state.sessions).to.be.empty;
    });

    describe('when first participant is added', function () {
        it('creates a session when first participant added', function () {
            commands.addParticipant(stub.commands.ADD_PARTICIPANT(1));

            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SessionCreatedEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SESSION_CREATED);
        });
    });

    describe('when participant is joining existing session', function () {
        beforeEach(function () {
            commands.requestSnapshot = _.noop;
            sinon.spy(commands, 'requestSnapshot');
            state = reducer(state, stub.events.SESSION_CREATED);

            commands.addParticipant(stub.commands.ADD_PARTICIPANT(2));
        });

        it('adds participant to the session', function () {
            expect(eventsQueue).to.have.length(1); // NOTE: not 2, because we noop'ed requestSnapshot
            expect(eventsQueue[0]).to.be.an.instanceof(events.ParticipantJoinedEvent);
            expect(eventsQueue[0]).to.eql(stub.events.PARTICIPANT_JOINED);
        });

        it('requests snapshot from presenter (via command call)', function () {
            expect(commands.requestSnapshot).to.have.been.calledWith(stub.commands.REQUEST_SNAPSHOT(2));
        });
    });

    describe('when participant is requesting a snapshot', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
        });

        describe('and participant is existing', function () {
            beforeEach(function () {
                state = reducer(state, stub.events.PARTICIPANT_JOINED);
                api.requestSnapshot = function () {};
                sinon.spy(api, 'requestSnapshot');

                commands.requestSnapshot(stub.commands.REQUEST_SNAPSHOT(2));
            });

            it('emits a SnapshotRequestedEvent with participantId', function () {
                expect(eventsQueue).to.have.length(1);
                expect(eventsQueue[0]).to.be.an.instanceof(events.SnapshotRequestedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.SNAPSHOT_REQUESTED(2));
            });

            it('sends a request over network to presenter\'s socket', function () {
                expect(api.requestSnapshot).to.have.been.calledWith({
                    presenterId: stub.constants.SOCKET(1)
                });
            });
        });
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
