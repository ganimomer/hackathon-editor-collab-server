const io = require('socket.io-client');

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

    const promiseFromSocketEvent = (event, method)=> {
      this[method] = () => {
        return new Promise(resolve => {
          this.socket.on(event, resolve);
        });
      };
    }

    const methodByEvent = {
      'change':            'receiveChange',
      'chat':              'receiveChatMessage',
      'spectator-joined':  'receiveSpectatorJoined',
      'spectator-left':    'receiveSpectatorLeft',
      'control-requested': 'controlRequested',
      'control-denied':    'controlDenied'
    };

    for (var key in methodByEvent) {
      promiseFromSocketEvent(key, methodByEvent[key]);
    }

    this.socket = io.connect(this.socketURL, this.options);

    this.socket.on('connect', () => {
      this.id = this.socket.id;
      this.socket.emit('join', this.userData);
      resolve();
    });

    this.socket.on('request-snapshot', () => {
      this.socket.emit('snapshot', { snapshot: this.snapshotData });
    });

    this.receiveSessionData = () => {
      return new Promise(resolve => {
        this.socket.on('session', data => {
          resolve(data);
        });
      });
    };

    this.becomePresenter = () => {
      return new Promise(resolve => {
        this.socket.on('session', data => {
          if (data.presenterId === this.id) {
            resolve(data);
          }
        });
      });
    };

  });

};

Client.prototype.disconnect = function () {
  return new Promise(resolve => {
    resolve(this.socket.disconnect());
  });
};

Client.prototype.sendChange = function (data) {
  this.socket.emit('change', data);
};

Client.prototype.sendChatMessage = function (message) {
  this.socket.emit('chat', message);
};

Client.prototype.requestControl = function () {
  this.socket.emit('request-control');
};

Client.prototype.takeControl = function () {
  this.socket.emit('take-control');
};

Client.prototype.denyControl = function (spectatorId) {
  this.socket.emit('deny-control', { spectatorId });
};

Client.prototype.grantControl = function (spectatorId) {
  this.socket.emit('grant-control', { spectatorId });
};


module.exports = Client;
