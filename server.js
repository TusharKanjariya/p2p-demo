// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static('public'));

// pretty routes
app.get('/send', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'send.html'))
);
app.get('/receive', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'receive.html'))
);

io.on('connection', (socket) => {
    // join a room per linkId
    socket.on('join', ({ linkId, role }) => {
        socket.join(linkId);
        socket.data = { linkId, role };
        // let the other side know someone is here
        socket.to(linkId).emit('peer-joined', { role });
    });

    // relay SDP/ICE
    socket.on('signal', ({ linkId, payload }) => {
        socket.to(linkId).emit('signal', payload);
    });

    socket.on('disconnect', () => {
        const { linkId, role } = socket.data || {};
        if (linkId) {
            socket.to(linkId).emit('peer-left', { role });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`P2P demo running on http://localhost:${PORT}`);
});
