const _ = require('lodash');
const chai = require('chai');
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const events = require('../src/events');
const reducer = require('../src/reducers/index');
const commandsModule = require('../src/commands');
const apiProto = require('../src/utils/api').prototype;

const stub = {
    constants: require('./stubs/constants'),
    commands: require('./stubs/commands'),
    events: require('./stubs/events'),
};

describe('commands:', () => {
    let state;
    let eventsQueue;
    let dispatch;
    let commands;
    let api;

    beforeEach(() => {
        eventsQueue = [];
        dispatch = e => {
            eventsQueue.push(e);
            state = reducer(state, e);
        };

        state = reducer(undefined, stub.events.INITIALIZE);
        api = _.mapValues(apiProto, () => sinon.spy());
        commands = _.mapValues(commandsModule, fn => _.curry(fn)(dispatch, () => state, api));
    });

    it('has sessions in an initial state', function () {
        expect(state.sessions).to.be.empty;
    });

    describe('when first participant is added', function () {
        beforeEach(function () {
            commands.addParticipant(stub.commands.ADD_PARTICIPANT(1));
        });

        it('creates a session when first participant added', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SessionCreatedEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SESSION_CREATED);
        });

        it('announces that (s)he is a presenter right now', function () {
            const presenter = stub.constants.PARTICIPANT_DETAILS(1);
            expect(api.announcePresenter).to.have.been.calledWith(
                { to : presenter.id }, { presenter }
            );
        });

        it('announces an empty list of spectators', function () {
            expect(api.announceSpectators).to.have.been.calledWith(
                { to: stub.constants.SOCKET(1) },
                { spectators: [] }
            );
        });
    });

    describe('when participant is joining existing session', function () {
        beforeEach(function () {
            commands.requestSnapshot = sinon.spy();
            state = reducer(state, stub.events.SESSION_CREATED);

            commands.addParticipant(stub.commands.ADD_PARTICIPANT(2));
        });

        it('adds participant to the session', function () {
            expect(eventsQueue).to.have.length(1); // NOTE: not 2, because we noop'ed requestSnapshot
            expect(eventsQueue[0]).to.be.an.instanceof(events.SpectatorJoinedEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SPECTATOR_JOINED(2));
        });

        it('requests snapshot from presenter (via command call)', function () {
            expect(commands.requestSnapshot).to.have.been.calledWith(stub.commands.REQUEST_SNAPSHOT(2));
        });

        it('informs participant via network about current presenter', function () {
            expect(api.announcePresenter).to.have.been.calledWith(
                { to: stub.constants.SOCKET(2) },
                { presenter: stub.constants.PARTICIPANT_DETAILS(1) }
            );
        });

        it('informs participant via network about current spectators', function () {
            expect(api.announceSpectators).to.have.been.calledWith(
                { to: stub.constants.SOCKET(2) },
                { spectators: [ stub.constants.PARTICIPANT_DETAILS(2) ] }
            );
        });

        it('broadcasts to all participants except a newbie that the newbie has joined', function () {
            expect(api.announceNewSpectators).to.have.been.calledWith({
                broadcastTo: stub.constants.SITE(1),
                except: stub.constants.SOCKET(2),
            }, {
                spectators: [stub.constants.PARTICIPANT_DETAILS(2)],
            });
        });
    });

    describe('when participant is requesting a snapshot', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
        });

        describe('and participant is existing', function () {
            beforeEach(function () {
                state = reducer(state, stub.events.SPECTATOR_JOINED(2));

                commands.requestSnapshot(stub.commands.REQUEST_SNAPSHOT(2));
            });

            it('emits a SnapshotRequestedEvent with participantId', function () {
                expect(eventsQueue).to.have.length(1);
                expect(eventsQueue[0]).to.be.an.instanceof(events.SnapshotRequestedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.SNAPSHOT_REQUESTED(2));
            });

            it('sends a request over network to presenter\'s socket', function () {
                expect(api.requestSnapshot).to.have.been.calledWith({
                    to: stub.constants.SOCKET(1)
                });
            });
        });
    });

    describe('when presenter is sending a snapshot back', function () {
        let snapshot;

        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.SPECTATOR_JOINED(2));
            state = reducer(state, stub.events.SPECTATOR_JOINED(3));
            state = reducer(state, stub.events.SNAPSHOT_REQUESTED(2));
            state = reducer(state, stub.events.SNAPSHOT_REQUESTED(3));

            const command = stub.commands.SEND_SNAPSHOT(1);
            snapshot = command.snapshot;
            commands.sendSnapshot(command);
        });

        it('emits a SnapshotSent event', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SnapshotSentEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SNAPSHOT_SENT());
        });

        it('sends a request over network to spectators\' sockets', function () {
            expect(api.sendSnapshot).to.have.been.calledWith({
                to: [ stub.constants.SOCKET(2), stub.constants.SOCKET(3) ]
            }, { snapshot });
        });
    });

    describe('when presenter is removed', function () {
        beforeEach(function () {
            commands.transferPresentership = sinon.spy();
            commands.removeSpectator = sinon.spy();
            state = reducer(state, stub.events.SESSION_CREATED);
        });

        describe('but there is at least one more spectator', function () {
            beforeEach(function () {
                state = reducer(state, stub.events.SPECTATOR_JOINED(2));

                commands.removeParticipant(stub.commands.REMOVE_PARTICIPANT(1));
            });

            it('firstly, transfers presenter rights to a first spectator', function () {
                expect(commands.transferPresentership).to.have.been.calledWith(
                    stub.commands.TRANSFER_PRESENTERSHIP(1, 2)
                );
            });

            it('secondly, removes a presenter prentending like (s)he was a spectator', function () {
                expect(commands.removeSpectator).to.have.been.calledWith(
                    stub.commands.REMOVE_SPECTATOR(1)
                );
            });
        });

        describe('and there are no spectators left', function () {
            beforeEach(function () {
                commands.removeParticipant(stub.commands.REMOVE_PARTICIPANT(1));
            });

            it('marks session as abandoned', function () {
                expect(eventsQueue).to.have.length(1);
                expect(eventsQueue[0]).to.be.an.instanceof(events.SessionAbandonedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.SESSION_ABANDONED());
            });
        });
    });

    describe('when a regular spectator is removed', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.SPECTATOR_JOINED(2));

            commands.removeSpectator(stub.commands.REMOVE_SPECTATOR(2));
        });

        // it('announces a new presenter to others left in a session', function () {
            // expect(api.announcePresenter).to.have.been.calledWith({
                // sessionId: stub.constants.SITE(1),
                // presenter: stub.constants.PARTICIPANT_DETAILS(2),
            // });
        // });

        it('marks participant as a member who left a session', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SpectatorLeftEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SPECTATOR_LEFT(2));
        });

        it('announces its leaving to other members in a session', function () {
            expect(api.announceExitingSpectators).to.have.been.calledWith({
                broadcastTo: stub.constants.SITE(1),
                except: stub.constants.SOCKET(2),
            }, {
                spectatorIds: [stub.constants.SOCKET(2)],
            });
        });
    });
});
