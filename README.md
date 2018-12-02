# socket.io-raft

[![NPM version](https://badge.fury.io/js/socket.io-raft.svg)](http://badge.fury.io/js/socket.io-raft)

Adapter to enable broadcasting of events to multiple separate socket.io server nodes without third-party dependencies.

This adapter leverages the [Raft](https://ramcloud.stanford.edu/raft.pdf) consensus algorithm to broadcast messages around.

**No need to manage a Redis cluster only for websockets!**

## How to use

```js
const io = require('socket.io')(3000);
const raftAdapter = require('socket.io-raft');
// Setup a three node raft cluster (localhost:8000 to localhost:8002)
io.adapter(raftAdapter({ port: 8000, peers: ['tcp://localhost:8001', 'tcp://localhost:8002'] }));
```

By running socket.io with the `socket.io-raft` adapter you can run
multiple socket.io instances in different processes or servers that can
all broadcast and emit events to and from each other.

So any of the following commands:

```js
io.emit('hello', 'to all clients');
io.to('room42').emit('hello', "to all clients in 'room42' room");

io.on('connection', (socket) => {
  socket.broadcast.emit('hello', 'to all clients except sender');
  socket.to('room42').emit('hello', "to all clients in 'room42' room except sender");
});
```

will properly be broadcast to the clients using the Raft Concensus protocol.

## API

To be documented.

## TODO

- [x] Broadcast support
- [ ] Room support
- [ ] Robustness
- [ ] Persistent rooms leveraging the Raft log
