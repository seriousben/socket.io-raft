const debugRaft = require('diagnostics')('socketio:raftadapter');
const debugRaftRaft = require('diagnostics')('socketio:raftadapter:raft');
const Log = require('liferaft/log');
const LifeRaft = require('liferaft');
const Adapter = require('socket.io-adapter');

const TCPRaft = require('./raft');

module.exports = raftAdapter;

function raftAdapter({ port, peers }) {
  return class Raft extends Adapter {
    constructor(nsp) {
      super(nsp);

      const raft = new TCPRaft(port, {
        // Log
        Log: Log,
        path: `./raft-log/${port}`,

        // Generic
        'election min': 2000,
        'election max': 5000,
        'heartbeat': 1000
      });

      raft.on('error', (e) => {
        console.error('something went wrong', e);
      });

      raft.on('heartbeat timeout', () => {
        debugRaft('heartbeat timeout, starting election');
      });

      raft.on('term change', (to, from) => {
        debugRaft('were now running on term %s -- was %s', to, from);
      });

      raft.on('leader change', (to, from) => {
        debugRaft('we have a new leader to: %s -- was %s', to, from);
      });

      raft.on('state change', (to, from) => {
        debugRaft('we have a state to: %s -- was %s', to, from);
      });

      raft.on('commit', (cmd) => {
        console.log('new command', cmd);
      });

      raft.on('follower', () => {
        console.log('Became follower');
      });

      raft.on('leader', () => {
        console.log('Became Leader');
      });

      raft.on('rpc', (packet) => {
        try {
          console.log('got rpc', packet);
          if (!packet || !packet.data || !packet.data.type) {
            return;
          }
          switch (packet.data.type) {
          case 'broadcast':
            super.broadcast(packet.data.wsPacket, packet.data.opts);
            break;
          default:
            console.error('unhandled msg type', packet.data.type);
          }
        } catch (e) {
          console.error(e);
        }
      });

      raft.on('candidate', () => {
        console.log('Became Candidate, No Quorum!');
      });

      peers.forEach(nr => {
        raft.join(nr);
      });
      this.raft = raft;
    }

    async broadcast(wsPacket, opts) {
      try {
        console.log('broadcast', wsPacket);
        const payload = {
          type: 'broadcast',
          wsPacket,
          opts,
        };
        const packet = await this.raft.packet('rpc', payload);
        console.log('sending RPC', payload);
        await this.raft.message(LifeRaft.CHILD, packet);
      } catch(err) {
        console.error(err);
      }
    }
  };
}
