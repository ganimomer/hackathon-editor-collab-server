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
        this.socket.on('change', resolve);
      });
    };

    this.receiveChatMessage = () => {
      return new Promise(resolve => {
        this.socket.on('chat', resolve);
      });
    };

    this.receiveSpectatorJoined = () => {
      return new Promise(resolve => {
        this.socket.on('spectator-joined', resolve);
      });
    };

    this.receiveSpectatorLeft = () => {
      return new Promise(resolve => {
        this.socket.on('spectator-left', resolve);
      });
    };

    this.controlRequested = () => {
      return new Promise(resolve => {
        this.socket.on('control-requested', resolve);
      });
    };

    this.controlDenied = () => {
      return new Promise(resolve => {
        this.socket.on('control-denied', resolve);
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

Client.prototype.denyControl = function (spectatorId) {
  this.socket.emit('deny-control', { spectatorId });
};

Client.prototype.grantControl = function (spectatorId) {
  this.socket.emit('grant-control', { spectatorId });
};


module.exports = Client;
