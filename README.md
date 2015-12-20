# hackathon-editor-collab-server
Repo for the websocket server for hackathon

# Message API
_(protocol version 2)_

## Glossary
* **Participant** &mdash; anyone connected to the session
* **Presenter** &mdash; a participant currently editing the site :monkey_face:
* **Spectator** &mdash; a participant following the presenter's activity :tropical_fish:

## Server → Client

### session :monkey_face: :tropical_fish:
```js 
Object { id, participants: { id:name }, presenterId, snapshot? } 
// session spectator data and (optionally) state snapshot
``` 

### spectator-joined :monkey_face: :tropical_fish:
```js 
Object { spectatorId } // 'spectatorId' has joined the session
```

### spectator-left :monkey_face: :tropical_fish:
```js 
Object { spectatorId } // 'spectatorId' has left the session
```

### presenter-changed :monkey_face: :tropical_fish:
```js 
Object { presenterId } //  'presenterId' has become the presenter
```

### control-denied :tropical_fish:
```js 
//  participant's control request was denied
```

### request-snapshot :monkey_face:
```js 
Object { spectatorId } // newly connected spectator 'spectatorId' requests state snapshot
``` 

### change :tropical_fish:
```js 
Object change // got a change from the presenter
```

### message :monkey_face: :tropical_fish:
```js 
Object { participantId, message } // got a message
```


## Client → Server

### join :monkey_face: :tropical_fish:
```js
Object { name, siteId } // user 'name' joins session 'siteId'
```

### snapshot :monkey_face:
```js
Object { snapshot } // presenter sends snapshot
```

### change :monkey_face:
```js 
Object change // send a change to spectators
```

### message :monkey_face: :tropical_fish:
```js 
Object message // send a message to everyone in the session
```

### request-control :tropical_fish:
```js 
// request presenter control
```

### grant-control :monkey_face:
```js 
Object { spectatorId } // grant presenter control to 'spectatorId'
```

### deny-control :monkey_face:
```js 
Object { spectatorId } // deny presenter control to 'spectatorId'
```
