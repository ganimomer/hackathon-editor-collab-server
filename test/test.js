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
      const spectatorJoined = presenter.receiveSpectatorJoined();
      yield spectator.connect();
      yield spectator.receiveSessionData();
      const spectatorData = yield spectatorJoined;

      expect(spectatorData.spectatorId).to.equal(spectator.id);
      expect(spectatorData.name).to.equal(spectator.userData.name);
    });

    it('presenter gets a spectator-left event', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield spectator.receiveSessionData();
      const spectatorLeft = presenter.receiveSpectatorLeft();
      yield spectator.disconnect();
      const spectatorData = yield spectatorLeft;

      expect(spectatorData.spectatorId).to.equal(spectator.id);
    });

    it('spectator gets a spectator-left event', function* () {
      yield presenter.connect();
      yield spectator.connect();
      yield secondSpectator.connect();
      yield spectator.receiveSessionData();
      yield secondSpectator.receiveSessionData();
      const spectatorLeft = secondSpectator.receiveSpectatorLeft();
      yield spectator.disconnect();
      const spectatorData = yield spectatorLeft;

      expect(spectatorData.spectatorId).to.equal(spectator.id);
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
