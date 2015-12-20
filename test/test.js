'use strict';

const chai = require('chai');
const io = require('socket.io-client');
const co = require('co');

describe('Collaboration Server',function () {

    function Client (userId, siteId, historyData) {
      this.options ={
          transports: ['websocket'],
          'force new connection': true
      };

      this.socketURL = 'http://0.0.0.0:8080';

      this.userData = {
        userId: userId,
        siteId: siteId
      };

      this.historyData = historyData;
    };

    Client.prototype.connect = function () {
      return new Promise((resolve, reject) => {
        this.socket = io.connect(this.socketURL, this.options);

        this.socket.on('connect', () => {
          this.socket.emit('join', this.userData);
          resolve();
        });

        this.socket.on('request-history', request => {
          request.history = this.historyData;
          this.socket.emit('history', request);
        });

        this.receiveHistory = new Promise(resolve => {
          this.socket.on('history', resolve);
        });

        this.becomePresenter = new Promise(resolve => {
          this.socket.on('leave', (data) => {
            console.log('leave', data);
            if (data.newEditor === this.userData.userId) {
              resolve(data);
            }
          });
        })

      });
    };

    Client.prototype.disconnect = function () {
      return new Promise(resolve => {
        resolve(this.socket.disconnect());
      });
    };

    it('history is requested from the first user when second user joins', function (done) {
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var participant = new Client('Omer', siteId);

      co(function* () {
        yield presenter.connect();
        yield participant.connect();
        yield participant.receiveHistory;
        // yield participant.disconnect();
        // yield presenter.disconnect();
      }).then(done);
    });

    it('history is requested from the first user when second user joins', function (done) {
      var siteId = 'Demo' + Math.floor(Math.random() * 100);
      var presenter = new Client('Leo', siteId);
      var participant = new Client('Omer', siteId);
      var secondParticipant = new Client('Etai', siteId);

      co(function* () {
        yield presenter.connect();
        yield participant.connect();
        yield participant.receiveHistory;
        yield presenter.disconnect();
        yield participant.becomePresenter;

        yield secondParticipant.connect();
        yield secondParticipant.receiveHistory;
        // yield participant.disconnect();
        // yield secondParticipant.disconnect();
      }).then(done);
    });

});
