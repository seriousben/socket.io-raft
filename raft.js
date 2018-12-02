const url = require('url');
const debug = require('diagnostics')('socketio:raftadapter:transport');
const LifeRaft = require('liferaft');
const net = require('net');
const notepack = require('notepack.io');

//
// Create a custom Raft instance which uses a plain TCP server and client to
// communicate back and forth.
//
module.exports = class TCPRaft extends LifeRaft {
  /**
   * Initialized, start connecting all the things.
   *
   * @param {Object} options Options.
   * @api private
   */
  initialize (options) {
    const server = net.createServer((socket) => {
      socket.on('data', buff => {
        var data = JSON.parse(buff.toString());

        debug(this.address +':packet#received', data);
        this.emit('data', data, data => {
          debug(this.address +':packet#reply', data);
          const encoded = notepack.encode(data);
          socket.write(encoded);
          socket.end();
        });
      });
    }).listen(options.address);

    this.once('end', function enc() {
      server.close();
    });
  }

  /**
   * The message to write.
   *
   * @TODO implement indefinitely sending of packets.
   * @param {Object} packet The packet to write to the connection.
   * @param {Function} fn Completion callback.
   * @api private
   */
  write (packet, fn) {
    let socket;
    try {
      const addressURL = new url.URL(this.address);
      socket = net.connect({host: addressURL.hostname, port: addressURL.port});
    } catch (e) {
      fn(e);
      return;
    }

    debug(this.address + ':packet#write', packet);
    socket.on('error', fn);
    socket.on('data', buff => {
      try {
        const decoded = notepack.decode(buff);
        debug(this.address + ':packet#callback', decoded);
        fn(undefined, decoded);
      } catch (e) {
        fn(e);
      }
    });

    socket.setNoDelay(true);
    socket.write(JSON.stringify(packet));
  }
}
