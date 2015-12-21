'use strict';

const chai = require('chai');
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

        this.receiveMessage = () => {
          return new Promise(resolve => {
            this.socket.on('message', resolve)
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
      data.userId = this.userData.userId;
      this.socket.emit('message', data);
    };

    it('snapshot is requested from the first user when second user joins', function (done) {
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var participant = new Client('Omer', siteId);

      co(function* () {
        yield presenter.connect();
        yield participant.connect();
        yield participant.receiveSessionData();
        yield participant.disconnect();
        yield presenter.disconnect();
      }).then(done);
    });

    it('snapshot is requested from the first user when second user joins', function (done) {
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var participant = new Client('Omer', siteId);
      var secondParticipant = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield participant.connect();
        yield participant.receiveSessionData();
        yield presenter.disconnect();
        yield participant.becomePresenter();

        yield secondParticipant.connect();
        yield secondParticipant.receiveSessionData();
        yield participant.disconnect();
        yield secondParticipant.disconnect();
      }).then(done);
    });

});
