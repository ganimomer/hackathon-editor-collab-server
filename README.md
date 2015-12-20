# hackathon-editor-collab-server
Repo for the websocket server for hackathon

# Message API 
_(protocol version 1)_

## Server → Client

### session
```js 
Object { [participants], presenterId } // session participants data
``` 

### participant-joined
```js 
Object { participantId } // 'participantId' has joined the session
```

### participant-left
```js 
Object { participantId } // 'participantId' has left the session
```

### presenter-changed
```js 
Object { presenterId } //  'presenterId' has become the presenter
```

### request-snapshot
```js 
Object { participantId } // newly connected participant 'participantId' requests state snapshot
``` 

### snapshot
```js 
Object { participantId, snapshot } // got state snapshot from the session presenter
``` 

### message
```js 
Object message // got a message
```

## Client → Server

### join
```js
Object { userId, siteId } // user 'userId' joins session 'siteId'
```

### snapshot
```js
Object { participantId } // presenter sends snapshot for `participantId`
```

### message
```js 
Object message // send a message to everyone in the session
```
