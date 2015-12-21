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

    const [p1, p2, p3] = [
        stub.constants.PARTICIPANT_DETAILS(1),
        stub.constants.PARTICIPANT_DETAILS(2),
        stub.constants.PARTICIPANT_DETAILS(3),
    ];

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
            state = reducer(state, stub.events.GHOST_BECAME_SPECTATOR(2));
            state = reducer(state, stub.events.PARTICIPANT_JOINING(3));

            commands.sendSnapshot(stub.commands.SEND_SNAPSHOT(1));
        });

        it('transforms a ghost into a spectator', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.GhostBecameSpectatorEvent);
            expect(eventsQueue[0]).to.eql(stub.events.GHOST_BECAME_SPECTATOR(3));
        });

        it('sends to a newbie all information about session', function () {
            expect(api.sendSession).to.have.been.calledWith({ to: [p3.id] },
                {
                    snapshot: stub.constants.SNAPSHOT(),
                    presenterId: p1.id,
                    participants: {
                        [p1.id]: p1.email,
                        [p2.id]: p2.email,
                        [p3.id]: p3.email,
                    },
                }
            );
        });

        it('broadcasts to a rest of spectators lightweight info about session (excluding snapshot)', function () {
            expect(api.sendSession).to.have.been.calledWith(
                { broadcastTo: stub.constants.SITE(1), except: [p3.id] },
                {
                    presenterId: p1.id,
                    participants: {
                        [p1.id]: p1.email,
                        [p2.id]: p2.email,
                        [p3.id]: p3.email,
                    },
                }
            );
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

        describe('and there are no spectators, but two ghosts', function () {
            beforeEach(function () {
                api.sendSession = sinon.spy();
                commands.disconnectSpectator = sinon.spy();

                state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
                state = reducer(state, stub.events.PARTICIPANT_JOINING(3));

                commands.disconnectParticipant(stub.commands.DISCONNECT_PARTICIPANT(1));
            });

            it('makes the ghost #1 a spectator', function () {
                expect(eventsQueue[0]).to.be.an.instanceof(events.GhostBecameSpectatorEvent);
                expect(eventsQueue[0]).to.eql(stub.events.GHOST_BECAME_SPECTATOR(2));
            });

            it('makes the ghost #2 a spectator', function () {
                expect(eventsQueue[1]).to.be.an.instanceof(events.GhostBecameSpectatorEvent);
                expect(eventsQueue[1]).to.eql(stub.events.GHOST_BECAME_SPECTATOR(3));
            });

            it('transfers presentership to ghost #1', function () {
                expect(eventsQueue[2]).to.be.an.instanceof(events.PresenterChangedEvent);
                expect(eventsQueue[2]).to.eql(stub.events.PRESENTER_CHANGED(2));
            });

            it('kicks a disconnected presenter (via command)', function () {
                // NOTE: this is going to be messy, but disconnect spectator will inform the ghosts about all session info
                expect(commands.disconnectSpectator).to.be.have.been.calledWith({ spectatorId: stub.constants.SOCKET(1) });
            });

            // it('broadcasts a shallow session info to all ghosts', function () {
            //     expect(api.sendSession).to.have.been.calledWith(
            //         { broadcastTo: stub.constants.SITE(1) },
            //         {
            //             presenterId: p2,
            //             participants: {
            //                 [p2.id]: p2.email,
            //                 [p3.id]: p3.email,
            //             },
            //         }
            //     );
            // });
        });
    });

    describe('when presentership is transferred', function () {
        beforeEach(function () {
            api.sendSession = sinon.spy();

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
                    expect(api.sendSession).to.have.been.calledWith(
                        { broadcastTo: stub.constants.SITE(1) },
                        {
                            presenterId: stub.constants.SOCKET(2),
                            participants: {
                                [p1.id]: p1.email,
                                [p2.id]: p2.email,
                            },
                        }
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

    describe('when presentership is forcibly taken', function () {
        beforeEach(function () {
            api.sendSession = sinon.spy();

            state = reducer(state, stub.events.SESSION_CREATED);
            state = reducer(state, stub.events.PARTICIPANT_JOINING(2));
            state = reducer(state, stub.events.PARTICIPANT_JOINING(3));
            state = reducer(state, stub.events.GHOST_BECAME_SPECTATOR(2));
        });

        describe('by presenter', function () {
            it('throws exception', function () {
                expect(() => commands.takePresentership(stub.commands.TAKE_PRESENTERSHIP(1)))
                   .to.throw;
            });
        });

        describe('by spectator', function () {
            beforeEach(() => commands.takePresentership(stub.commands.TAKE_PRESENTERSHIP(2)));

            it('marks spectator as a presenter', function () {
                expect(eventsQueue).to.have.length(1);
                expect(eventsQueue[0]).to.be.an.instanceof(events.PresenterChangedEvent);
                expect(eventsQueue[0]).to.eql(stub.events.PRESENTER_CHANGED(2));
            });

            it('announces new presenter to everyone in session', function () {
                expect(api.sendSession).to.have.been.calledWith(
                    { broadcastTo: stub.constants.SITE(1) },
                    {
                        presenterId: stub.constants.SOCKET(2),
                        participants: {
                            [p1.id]: p1.email,
                            [p2.id]: p2.email,
                        },
                    }
                );
            });
        });

        describe('by ghost', function () {
            it('throws exception', function () {
                expect(() => commands.takePresentership(stub.commands.TAKE_PRESENTERSHIP(3)))
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
            state = reducer(state, stub.events.PRESENTER_CHANGED(2));

            commands.disconnectSpectator(stub.commands.DISCONNECT_SPECTATOR(1));
        });

        it('marks participant as a member who left a session', function () {
            expect(eventsQueue).to.have.length(1);
            expect(eventsQueue[0]).to.be.an.instanceof(events.SpectatorLeftEvent);
            expect(eventsQueue[0]).to.eql(stub.events.SPECTATOR_LEFT(1));
        });

        it('announces its leaving to other members in a session', function () {
            expect(api.sendSession).to.have.been.calledWith({
                broadcastTo: stub.constants.SITE(1),
            }, {
                presenterId: stub.constants.SOCKET(2),
                participants: {
                    [p2.id]: p2.email,
                },
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
    });
});
