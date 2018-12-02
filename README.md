# socket.io-raft

[![NPM version](https://badge.fury.io/js/socket.io-raft.svg)](http://badge.fury.io/js/socket.io-raft)

Adapter to enable broadcasting of events to multiple separate socket.io server nodes without third-party dependencies.

## Raft

This adapter leverages the [Raft](https://ramcloud.stanford.edu/raft.pdf) consensus algorithm to broadcast messages around.
