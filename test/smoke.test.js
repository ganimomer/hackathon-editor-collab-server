const chai = require('chai');
const io = require('socket.io-client');
const socketURL = 'http://0.0.0.0:8080';

const options ={
    transports: ['websocket'],
    'force new connection': true
};

let siteId = 'Demo';
const participant1 = { userId: 'Presenter', siteId: 'Demo' };
const participant2 = { userId: 'Leo', siteId: 'Demo' };
// const participant3 = { userId: 'Omer', siteId: 'Demo' };

describe('Collaboration Server',function(){
    let socket1 = null;
    let socket2 = null;

    function afterFirstAndSecondUsersHaveJoined(callback) {
        socket1 = io.connect(socketURL, options);

        socket1.on('request-history', request => {
            request.history = { bla: 'bla' };
            socket1.emit('history', request);
        });
        
        socket1.on('connect', function () {
            socket1.emit('join', participant1);

            socket2 = io.connect(socketURL, options);

            socket2.on('connect', function () {
                socket2.emit('join', participant2);
            });

            socket2.on('history', () => {
                callback();
            });
        });
    }

    beforeEach(function () {
    });

    it('history is requested from first user when second user joins', function (done) {
        afterFirstAndSecondUsersHaveJoined(done);
    });

    it('history is requested from second user when first user reconnects', function (done) {
        afterFirstAndSecondUsersHaveJoined(function () {
            socket1.disconnect();
            console.log('Hello, world');
            done();
        });
    });

    afterEach(function (done) {
        socket1.disconnect();
        socket2.disconnect();
        setTimeout(done, 100);
    });

//
//    it('Should broadcast new user to all users', function(done){
//        const client1 = io.connect(socketURL, options);
//
//        client1.on('connect', function(data){
//            client1.emit('connection name', participant1);
//
//            /* Since first client is connected, we connect
//               the second client. */
//            const client2 = io.connect(socketURL, options);
//
//            client2.on('connect', function(data){
//                client2.emit('connection name', participant2);
//            });
//
//            client2.on('new user', function(usersName){
//                usersName.should.equal(participant2.name + ' has joined.');
//                client2.disconnect();
//            });
//
//        });
//
//        const numUsers = 0;
//        client1.on('new user', function(usersName){
//            numUsers += 1;
//
//            if(numUsers === 2){
//                usersName.should.equal(participant2.name + ' has joined.');
//                client1.disconnect();
//                done();
//            }
//        });
//    });
});
