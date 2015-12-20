# hackathon-editor-collab-server
Repo for the websocket server for hackathon

# Message API
_(protocol version 1)_

## Glossary
* **Participant** &mdash; anyone connected to the session
* **Presenter** &mdash; a participant currently editing the site :monkey_face:
* **Spectator** &mdash; a participant following the presenter's activity :tropical_fish:

## Server → Client

### session
```js 
Object { id, participants: { id:name }, presenterId, snapshot? } // session spectator data and (optionally) state snapshot
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

### control-denied ::
```js 
//  participant's control request was denied
```

### request-snapshot
```js 
Object { spectatorId } // newly connected spectator 'spectatorId' requests state snapshot
``` 

### change
```js 
Object change // got a change from the presenter
```

### message
```js 
Object { participantId, message } // got a message
```


## Client → Server

### join
```js
Object { name, siteId } // user 'name' joins session 'siteId'
```

### snapshot
```js
Object { snapshot } // presenter sends snapshot
```

### change
```js 
Object change // send a change to spectators
```

### message
```js 
Object message // send a message to everyone in the session
```

### request-control
```js 
// request presenter control
```

### grant-control
```js 
Object { spectatorId } // grant presenter control to 'spectatorId'
```

### deny-control
```js 
Object { spectatorId } // deny presenter control to 'spectatorId'
```
