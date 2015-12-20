# hackathon-editor-collab-server
Repo for the websocket server for hackathon

# Message API 
_(protocol version 1)_

## Glossary
* **Participant** &mdash; anyone connected to the session
* **Presenter** &mdash; a participant currently editing the site
* **Spectator** &mdash; a participant following the presenter's activity

## Server → Client

### session
```js 
Object { [spectators], presenterId } // session spectator data
``` 

### spectator-joined
```js 
Object { spectatorId } // 'spectatorId' has joined the session
```

### spectator-left
```js 
Object { spectatorId } // 'spectatorId' has left the session
```

### presenter-changed
```js 
Object { presenterId } //  'presenterId' has become the presenter
```

### request-snapshot
```js 
Object { spectatorId } // newly connected spectator 'spectatorId' requests state snapshot
``` 

### snapshot
```js 
Object { spectatorId, snapshot } // got state snapshot from the session presenter
``` 

### message
```js 
Object message // got a message
```

## Client → Server

### join
```js
Object { participantId, siteId } // user 'participantId' joins session 'siteId'
```

### snapshot
```js
Object { spectatorId } // presenter sends snapshot for 'spectatorId'
```

### message
```js 
Object message // send a message to everyone in the session
```
