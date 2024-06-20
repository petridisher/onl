const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Add new player
  players[socket.id] = {
    x: 0,
    y: 0
  };

  // Send current players to the new player
  socket.emit('currentPlayers', players);

  // Notify all clients about the new player
  socket.broadcast.emit('newPlayer', { id: socket.id, x: 0, y: 0 });

  // Handle player movement
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x += data.x;
      players[socket.id].y += data.y;
      io.emit('playerMoved', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (let name of Object.keys(interfaces)) {
    for (let iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

const localIp = getLocalIpAddress();

server.listen(PORT, () => {
  console.log(`Server is running on http://${localIp}:${PORT}`);
});
