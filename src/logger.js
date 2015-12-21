const DEBUG = true;

module.exports = {
    logEvent(event) {
        this.spacer();
        DEBUG && console.dir(event);
    },
    logStateBefore(state) {
        // DEBUG && console.log('state was');
        // DEBUG && console.dir(state);
    },
    logStateAfter(state) {
        this.spacer();
        DEBUG && console.log('state became');
        DEBUG && console.dir(state);
    },
    logCommand(name, args) {
        this.spacer();
        DEBUG && console.log('comands.', name, '()\narguments:');
        DEBUG && console.dir(args[0]);
    },
    logNetworkRequest(eventName, routeInfo, message) {
        this.spacer();
        DEBUG && console.log('io.emit("', eventName, '").route(', routeInfo, ').message');
        DEBUG && console.dir(message);
    },
    logSocket(id) {
        DEBUG && console.log('sent to socket', id);
    },
    spacer() {
        DEBUG && console.log('==============================');;
    },
};
