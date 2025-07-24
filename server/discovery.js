const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const MULTICAST_ADDR = '239.255.255.250';
const PORT = 55555;

const uploadDir = path.join(__dirname, 'uploads');

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
const peers = new Map();

function getSharedFiles() {
  try {
    const files = fs.readdirSync(uploadDir);
    return files.map(filename => {
      const stats = fs.statSync(path.join(uploadDir, filename));
      return { name: filename, size: stats.size };
    });
  } catch {
    return [];
  }
}

socket.bind(PORT, () => {
  socket.addMembership(MULTICAST_ADDR);
  console.log(`Listening for peers on ${MULTICAST_ADDR}:${PORT}`);

  setInterval(() => {
    const message = {
      id: process.pid,
      time: Date.now(),
      files: getSharedFiles(),
    };
    const buf = Buffer.from(JSON.stringify(message));
    socket.send(buf, 0, buf.length, PORT, MULTICAST_ADDR);
  }, 3000);
});

socket.on('message', (msg, rinfo) => {
  try {
    const peer = JSON.parse(msg.toString());
    if (peer.id !== process.pid) {
      peers.set(peer.id, {
        address: rinfo.address,
        lastSeen: Date.now(),
        files: peer.files || [],
      });
      console.log(`Discovered peer ${peer.id} at ${rinfo.address} sharing ${peer.files?.length || 0} files`);
    }
  } catch (err) {
    console.error('Failed to parse message', err);
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [id, peer] of peers) {
    if (now - peer.lastSeen > 10000) {
      peers.delete(id);
      console.log(`Peer ${id} timed out`);
    }
  }
}, 5000);

module.exports = { peers };
