'use strict';

require('co-mocha');
const chai = require('chai');
const expect = chai.expect;

const Client = require('./client');

describe('Collaboration Server', function () {

    var presenter;
    var spectator;
    var secondSpectator;
    var secondPresenter;

    beforeEach(function () {
      const siteId = 'Demo' + Math.floor(Math.random() * 1000000);
      presenter = new Client('Leo', siteId);
      spectator = new Client('Omer', siteId);
      secondSpectator = new Client('Etai', siteId);
      secondPresenter = secondSpectator;
    });

    it('snapshot is requested from the first user when second user joins', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();
      yield spectator.disconnect();
      yield presenter.disconnect();
    });

    it('spectator becomes presenter when presenter leaves', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();
      yield presenter.disconnect();
      yield spectator.becomePresenter();

      yield secondSpectator.connect();
      yield secondSpectator.receiveSessionData();
      yield spectator.disconnect();
      yield secondSpectator.disconnect();
    });

    it('everyone disconnects then a new participant connects', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();
      yield presenter.disconnect();
      yield spectator.disconnect();

      yield secondPresenter.connect();
      const session = yield secondPresenter.receiveSessionData();
      expect(session.presenterId).to.equal(secondPresenter.id);
      yield secondPresenter.disconnect();
    });

    it('presenter sends a change message to spectators', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();

      const data = { change: 'wooo' };
      const change = spectator.receiveChange();
      presenter.sendChange(data);
      const message = yield change;
      expect(message).to.deep.equal(data);
    });

    it('presenter gets a spectator-joined event', function* () {
      yield presenter.connect();
      yield presenter.receiveSessionData();
      const spectatorJoined = presenter.receiveSessionData();
      yield spectator.connect();
      const sessionDataSentToSpectator = yield spectator.receiveSessionData();
      const sessionDataSentToPresenter = yield spectatorJoined;

      expect(sessionDataSentToPresenter).to.eql({
          presenterId: presenter.id,
          participants: {
              [presenter.id]: presenter.userData.name,
              [spectator.id]: spectator.userData.name,
          },
      });

      expect(sessionDataSentToSpectator).to.eql({
          presenterId: presenter.id,
          participants: {
              [presenter.id]: presenter.userData.name,
              [spectator.id]: spectator.userData.name,
          },
          snapshot: presenter.snapshotData
      });
    });

    it('presenter gets a spectator-left event', function* () {
      yield presenter.connect();
      yield presenter.receiveSessionData();

      yield spectator.connect();
      yield spectator.receiveSessionData();
      yield presenter.receiveSessionData();

      const spectatorLeft = presenter.receiveSessionData();
      yield spectator.disconnect();
      const sessionDataSentToPresenter = yield spectatorLeft;

      expect(sessionDataSentToPresenter).to.eql({
          presenterId: presenter.id,
          participants: {
              [presenter.id]: presenter.userData.name,
          },
      });
    });

    it.skip('spectator gets a spectator-left event', function* () {
      yield presenter.connect();

      yield spectator.connect();
      const s1 = yield spectator.receiveSessionData();
      console.log('s1', s1);

      yield secondSpectator.connect();
      const s2 = yield spectator.receiveSessionData();
      console.log('s2', s2);

      const spectatorLeft = spectator.receiveSessionData();
      secondSpectator.disconnect();
      const sessionDataSentToSpectator = yield spectatorLeft;
      console.log('sessionDataSentToSpectator', sessionDataSentToSpectator);

      const s3 = yield spectator.receiveSessionData();
      console.log('s3', s3);

      expect(sessionDataSentToSpectator).to.eql({
          presenterId: presenter.id,
          participants: {
              [presenter.id]: presenter.userData.name,
              [spectator.id]: spectator.userData.name,
          },
      });
    });

    it('spectator requests and gets control', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();

      const controlRequested = presenter.controlRequested();
      spectator.requestControl();
      yield controlRequested;
      const controlGranted = spectator.becomePresenter();
      presenter.grantControl(spectator.id);
      yield controlGranted;
    });

    it('spectator takes and gets control', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();

      spectator.takeControl();
      const controlGranted = spectator.becomePresenter();
      presenter.grantControl(spectator.id);
      yield controlGranted;
    });

    it('spectator requests and is denied control', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();

      const controlRequested = presenter.controlRequested();
      spectator.requestControl();
      yield controlRequested;
      const controlDenied = spectator.controlDenied();
      presenter.denyControl(spectator.id);
      yield controlDenied;
    });

    it('presenter sends a chat message to spectators', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();

      const message = { data: 'wooo' };
      const chatMessage = spectator.receiveChatMessage();
      presenter.sendChatMessage(message);
      const data = yield chatMessage;
      expect(data.message).to.deep.equal(message);
    });

});
