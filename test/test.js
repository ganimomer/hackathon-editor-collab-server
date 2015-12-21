'use strict';

const chai = require('chai');
const expect = chai.expect;
const co = require('co');

const Client = require('./client');

describe('Collaboration Server', function () {

    it('snapshot is requested from the first user when second user joins', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();
        yield spectator.disconnect();
        yield presenter.disconnect();
      }).then(done);
    });

    it('spectator becomes presenter when presenter leaves', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondSpectator = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();
        yield presenter.disconnect();
        yield spectator.becomePresenter();

        yield secondSpectator.connect();
        yield secondSpectator.receiveSessionData();
        yield spectator.disconnect();
        yield secondSpectator.disconnect();
      }).then(done);
    });

    it('everyone disconnects then a new participant connects', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondPresenter = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();
        yield presenter.disconnect();
        yield spectator.disconnect();

        yield secondPresenter.connect();
        const session = yield secondPresenter.receiveSessionData();
        expect(session.presenterId).to.equal(secondPresenter.id);
        yield secondPresenter.disconnect();
      }).then(done);
    });

    it('presenter sends a change message to spectators', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondPresenter = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();

        const data = { change: 'wooo' };
        const change = spectator.receiveChange();
        presenter.send(data);
        const message = yield change;
        expect(message).to.deep.equal(data);

      }).then(done);
    });

    it('presenter gets a spectator-joined event', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondPresenter = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        const spectatorJoined = presenter.receiveSpectatorJoined();
        yield spectator.connect();
        yield spectator.receiveSessionData();
        const spectatorData = yield spectatorJoined;

        expect(spectatorData.spectatorId).to.equal(spectator.id);
        expect(spectatorData.name).to.equal(spectator.userData.name);
      }).catch(err => console.log(err)).then(done);
    });

    it('presenter gets a spectator-left event', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondPresenter = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();
        const spectatorLeft = presenter.receiveSpectatorLeft();
        yield spectator.disconnect();
        const spectatorData = yield spectatorLeft;

        expect(spectatorData.spectatorId).to.equal(spectator.id);
      }).then(done);
    });

    it('spectator gets a spectator-left event', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondSpectator = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield secondSpectator.connect();
        yield spectator.receiveSessionData();
        const spectatorLeft = secondSpectator.receiveSpectatorLeft();
        yield spectator.disconnect();
        const spectatorData = yield spectatorLeft;

        expect(spectatorData.spectatorId).to.equal(spectator.id);
      }).then(done);
    });

    it('spectator requests and gets control', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondSpectator = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();

        const controlRequested = presenter.controlRequested();
        spectator.requestControl();
        yield controlRequested;
        const controlGranted = spectator.becomePresenter();
        presenter.grantControl(spectator.id);
        yield controlGranted;
      }).catch(err => console.log(err)).then(done);
    });

    it('spectator requests and is denied control', function (done) {
      const siteId = 'Demo' + Math.floor(Math.random() * 100);
      const presenter = new Client('Leo', siteId);
      const spectator = new Client('Omer', siteId);
      const secondSpectator = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();

        const controlRequested = presenter.controlRequested();
        spectator.requestControl();
        yield controlRequested;
        const controlDenied = spectator.controlDenied();
        presenter.denyControl(spectator.id);
        yield controlDenied;
      }).catch(err => console.log(err)).then(done);
    });

});
