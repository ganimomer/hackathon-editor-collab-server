const _ = require('lodash');
const chai = require('chai');
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const events = require('../src/events');
const reducer = require('../src/reducers/index');
const commandsModule = require('../src/commands');
const apiModule = require('../src/utils/api');

const stub = {
    constants: require('./stubs/constants'),
    commands: require('./stubs/commands'),
    events: require('./stubs/events'),
};

describe('commands', () => {
    let state;
    let eventsQueue;
    let dispatch;
    let commands;
    let api;

    beforeEach(() => {
        eventsQueue = [];
        dispatch = e => eventsQueue.push(e);
        state = reducer(undefined, stub.events.INITIALIZE);
        api = _.mapValues(apiModule, () => (function () {}));
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
            expect(eventsQueue[0]).to.eql(stub.events.PARTICIPANT_JOINED(2));
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
                state = reducer(state, stub.events.PARTICIPANT_JOINED(2));
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

    describe('when presenter is sending a snapshot back', function () {
        let snapshot;

        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINED(2));
            state = reducer(state, stub.events.PARTICIPANT_JOINED(3));
            state = reducer(state, stub.events.SNAPSHOT_REQUESTED(2));
            state = reducer(state, stub.events.SNAPSHOT_REQUESTED(3));

            api.sendSnapshot = function () {};
            sinon.spy(api, 'sendSnapshot');

            const command = stub.commands.SEND_SNAPSHOT(1);
            snapshot = command.snapshot;
            commands.sendSnapshot(command);
        });

        it('emits a SnapshotSent event', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SnapshotSentEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SNAPSHOT_SENT());
        });

        it('sends a request over network to participants\' socket', function () {
            expect(api.sendSnapshot).to.have.been.calledWith({
                participantId: stub.constants.SOCKET(2),
                history: snapshot
            });

            expect(api.sendSnapshot).to.have.been.calledWith({
                participantId: stub.constants.SOCKET(3),
                history: snapshot
            });
        });
    });

    describe('when presenter is removed', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
        });

        describe('but there is at least one more participant', function () {
            beforeEach(function () {
                state = reducer(state, stub.events.PARTICIPANT_JOINED(2));

                api.sendSessionRights = function () {};
                sinon.spy(api, 'sendSessionRights');

                commands.removeParticipant(stub.commands.REMOVE_PARTICIPANT(1));
            });

            it('transfers presenter rights to a first free participant', function () {
                expect(eventsQueue[0]).to.be.an.instanceof(events.PresenterChangedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.PRESENTER_CHANGED(2));
            });

            it('informs new presenters over a network about theirs rights', function () {
                expect(api.sendSessionRights).to.have.been.calledWith({
                    participantId: stub.constants.SOCKET(2),
                    isPresenter: true,
                });
            });
        });

        describe('and there are no participants left', function () {
            beforeEach(function () {
                commands.removeParticipant(stub.commands.REMOVE_PARTICIPANT(1));
            });

            it('marks session as abandoned', function () {
                expect(eventsQueue[0]).to.be.an.instanceof(events.SessionAbandonedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.SESSION_ABANDONED());
            });
        });
    });

    describe('when a regular participant is removed', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINED(2));
            commands.removeParticipant(stub.commands.REMOVE_PARTICIPANT(2));
        });

        it('marks participant as a member who left a session', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.ParticipantLeftEvent);
            expect(eventsQueue[0]).to.eql(stub.events.PARTICIPANT_LEFT(2));
        });
    });
});
