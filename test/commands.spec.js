const _ = require('lodash');
const chai = require('chai');
const { expect } = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const events = require('../src/events');
const reducer = require('../src/reducers');
const commandsModule = require('../src/commands');
const apiProto = require('../src/NetworkAPI').prototype;

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

    describe('when first participant connects', function () {
        beforeEach(function () {
            commands.handleJoinRequest(stub.commands.HANDLE_JOIN_REQUEST(1));
        });

        it('creates a session, when first participant connects to the site editing', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SessionCreatedEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SESSION_CREATED);
        });

        it('sends session information (without snapshot, presenterId===participant.id) to participant', function () {
            const firstParticipant = stub.constants.PARTICIPANT_DETAILS(1);
            expect(api.sendSession).to.have.been.calledWith({ to: firstParticipant.id },
                {
                    id: firstParticipant.id,
                    presenterId: firstParticipant.id,
                    participants: {
                        [firstParticipant.id]: firstParticipant.email,
                    },
                }
            );
        });
    });

    describe('when participant wants to join an existing session', function () {
        beforeEach(function () {
            commands.requestSnapshot = sinon.spy();
            state = reducer(state, stub.events.SESSION_CREATED);

            commands.handleJoinRequest(stub.commands.HANDLE_JOIN_REQUEST(2));
        });

        it('marks participant as "joining" to the session', function () {
            expect(eventsQueue).to.have.length(1); // NOTE: not 2, because we noop'ed requestSnapshot
            expect(eventsQueue[0]).to.be.an.instanceof(events.ParticipantJoiningEvent);
            expect(eventsQueue[0]).to.eql(stub.events.PARTICIPANT_JOINING(2));
        });

        it('requests a snapshot from presenter via network', function () {
            expect(api.requestSnapshot).to.have.been.calledWith({
                to: stub.constants.SOCKET(1)
            });
        });
    });

    describe('when presenter is sending a snapshot back', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINING(2));

            commands.sendSnapshot(stub.commands.SEND_SNAPSHOT(1));
        });

        it('transforms a ghost into a spectator', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.GhostBecameSpectatorEvent);
            expect(eventsQueue[0]).to.eql(stub.events.GHOST_BECAME_SPECTATOR(2));
        });

        it('sends to a spectator all information about session', function () {
            const [p1, p2] = [
                stub.constants.PARTICIPANT_DETAILS(1),
                stub.constants.PARTICIPANT_DETAILS(2),
            ];

            expect(api.sendSession).to.have.been.calledWith({ to: p2.id },
                {
                    id: p2.id,
                    presenterId: p1.id,
                    participants: {
                        [p1.id]: p1.email,
                        [p2.id]: p2.email,
                    },
                    snapshot: stub.constants.SNAPSHOT(),
                }
            );
        });

        it('broadcasts to presenter and spectators that they have a new spectator', function () {
            const { id: spectatorId, email } = stub.constants.PARTICIPANT_DETAILS(2);

            expect(api.announceNewSpectators).to.have.been.calledWith({
                broadcastTo: stub.constants.SITE(1),
                except: [stub.constants.SOCKET(2)],
            }, {
                [spectatorId]: email,
            });
        });
    });

    describe('when presenter is removed', function () {
        beforeEach(function () {
            commands.transferPresentership = () => dispatch(stub.events.PRESENTER_CHANGED(2));
            commands.disconnectSpectator = sinon.spy();
            commands.disconnectGhost = sinon.spy();
            sinon.spy(commands, 'transferPresentership');
            state = reducer(state, stub.events.SESSION_CREATED);
        });

        describe('but there is at least one more spectator', function () {
            beforeEach(function () {
                state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
                state = reducer(state, stub.events.GHOST_BECAME_SPECTATOR(2));

                commands.disconnectParticipant(stub.commands.DISCONNECT_PARTICIPANT(1));
            });

            it('firstly, transfers presenter rights to a first spectator', function () {
                expect(commands.transferPresentership).to.have.been.calledWith(
                    stub.commands.TRANSFER_PRESENTERSHIP(1, 2)
                );
            });

            it('secondly, removes a presenter prentending like (s)he was a spectator', function () {
                expect(commands.disconnectSpectator).to.have.been.calledWith(
                    stub.commands.DISCONNECT_SPECTATOR(1)
                );
            });
        });

        describe('and there are no spectators, but one ghost', function () {
            beforeEach(function () {
                commands.disconnectGhost = sinon.spy();
                state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
                commands.disconnectParticipant(stub.commands.DISCONNECT_PARTICIPANT(1));
            });

            it('marks session as abandoned', function () {
                expect(eventsQueue).to.have.length(1);
                expect(eventsQueue[0]).to.be.an.instanceof(events.SessionAbandonedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.SESSION_ABANDONED());
            });

            it('forcefully disconnects ghost', function () {
                expect(commands.disconnectGhost).to.have.been.calledWith({
                    isForce: true,
                    ghostId: stub.constants.SOCKET(2),
                });
            });
        });
    });

    describe('when presentership is transferred', function () {
        beforeEach(function () {
            api.announcePresenterChanged = sinon.spy();

            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
            state = reducer(state, stub.events.PARTICIPANT_JOINING(3));
            state = reducer(state, stub.events.GHOST_BECAME_SPECTATOR(2));
        });

        describe('by presenter', function () {
            describe('to presenter', function () {
                it('throws exception', function () {
                    expect(() => commands.transferPresentership(stub.commands.TRANSFER_PRESENTERSHIP(1, 1)))
                       .to.throw;
                });
            });

            describe('to spectator', function () {
                beforeEach(() => commands.transferPresentership(stub.commands.TRANSFER_PRESENTERSHIP(1, 2)));

                it('marks spectator as a presenter', function () {
                    expect(eventsQueue).to.have.length(1);
                    expect(eventsQueue[0]).to.be.an.instanceof(events.PresenterChangedEvent);
                    expect(eventsQueue[0]).to.eql(stub.events.PRESENTER_CHANGED(2));
                });

                it('announces new presenter to everyone in session', function () {
                    expect(api.announcePresenterChanged).to.have.been.calledWith(
                        { broadcastTo: stub.constants.SITE(1) },
                        { presenterId: stub.constants.SOCKET(2) }
                    );
                });
            });

            describe('to ghost', function () {
                it('throws exception', function () {
                    expect(() => commands.transferPresentership(stub.commands.TRANSFER_PRESENTERSHIP(1, 3)))
                       .to.throw;
                });
            });
        });

        describe('by non-presenter', function () {
            it('throws exception', function () {
                expect(() => commands.transferPresentership(stub.commands.TRANSFER_PRESENTERSHIP(2, 2)))
                   .to.throw;
            });
        });
    });

    describe('when presentership is transferred by spectator or to ghost ', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
            state = reducer(state, stub.events.PARTICIPANT_JOINING(3));
            state = reducer(state, stub.events.GHOST_BECAME_SPECTATOR(2));
        });

        it('sends you to the hell', function () {
            expect(() => commands.transferPresentership(stub.commands.TRANSFER_PRESENTERSHIP(2, 1)))
                .to.throw;
        });

        it('sends you to the hell', function () {
            expect(() => commands.transferPresentership(stub.commands.TRANSFER_PRESENTERSHIP(2, 1)))
                .to.throw;
        });
    });

    describe('when a regular spectator is disconnected', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
            state = reducer(state, stub.events.GHOST_BECAME_SPECTATOR(2));

            commands.disconnectSpectator(stub.commands.DISCONNECT_SPECTATOR(2));
        });

        it('marks participant as a member who left a session', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SpectatorLeftEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SPECTATOR_LEFT(2));
        });

        it('announces its leaving to other members in a session', function () {
            expect(api.announceLeavingSpectator).to.have.been.calledWith({
                broadcastTo: stub.constants.SITE(1),
                except: stub.constants.SOCKET(2),
            }, {
                spectatorId: stub.constants.SOCKET(2),
            });
        });
    });

    describe('when a ghost is disconnected', function () {
        beforeEach(function () {
            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
        });

        it('removes a ghost from the session', function () {
            commands.disconnectGhost(stub.commands.DISCONNECT_GHOST(2, false));

            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.GhostDisconnectedEvent);
            expect(eventsQueue[0]).to.eql(stub.events.GHOST_DISCONNECTED(2));
        });

        describe('and it happens because presenter has exited', function () {
            it('informs the ghost that it is alone without any hope', function () {
                commands.disconnectGhost(stub.commands.DISCONNECT_GHOST(2, true));

                expect(api.announceLeavingSpectator).to.have.been.calledWith(
                    { to: stub.constants.SOCKET(2) },
                    { spectatorId: stub.constants.SOCKET(1) }
                );
            });
        });
    });
});
