'use strict';

const chai = require('chai');
const expect = chai.expect;
const io = require('socket.io-client');
const co = require('co');

describe('Collaboration Server',function () {

    function Client (userId, siteId, snapshotData) {
      this.options ={
          transports: ['websocket'],
          'force new connection': true
      };

      this.socketURL = 'http://0.0.0.0:8080';

      this.userData = {
        name: userId,
        siteId: siteId
      };

      this.snapshotData = snapshotData || { data: 'woo' };
    };

    Client.prototype.connect = function () {
      return new Promise((resolve, reject) => {
        this.socket = io.connect(this.socketURL, this.options);

        this.socket.on('connect', () => {
          this.socket.emit('join', this.userData);
          resolve();
        });

        this.socket.on('request-snapshot', () => {
          this.socket.emit('snapshot', { snapshot: this.snapshotData });
        });

        this.receiveSessionData = () => {
          return new Promise(resolve => {
            this.socket.on('session', data => {
              this.id = data.id;
              resolve(data);
            });
          });
        };

        this.becomePresenter = () => {
          return new Promise(resolve => {
            this.socket.on('presenter-changed', data => {
              if (data.presenterId === this.id) {
                resolve(data);
              }
            });
          });
        };

        this.receiveChange = () => {
          return new Promise(resolve => {
            this.socket.on('change', resolve)
          });
        };

      });
    };

    Client.prototype.disconnect = function () {
      return new Promise(resolve => {
        resolve(this.socket.disconnect());
      });
    };

    Client.prototype.send = function (data) {
      this.socket.emit('change', data);
    };

    it('snapshot is requested from the first user when second user joins', function (done) {
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var spectator = new Client('Omer', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();
        yield spectator.disconnect();
        yield presenter.disconnect();
      }).then(done);
    });

    it('snapshot is requested from the first user when second user joins', function (done) {
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var spectator = new Client('Omer', siteId);
      var secondSpectator = new Client('Etai', siteId);

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
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var spectator = new Client('Omer', siteId);
      var secondPresenter = new Client('Etai', siteId);

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
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var spectator = new Client('Omer', siteId);
      var secondPresenter = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield spectator.connect();
        yield spectator.receiveSessionData();

        var data = { change: 'wooo' };
        var change = spectator.receiveChange();
        presenter.send(data);
        var message = yield change;
        expect(message).to.deep.equal(data);

      }).then(done);
    });
});
