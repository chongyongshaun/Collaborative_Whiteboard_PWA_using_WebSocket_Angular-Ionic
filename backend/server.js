const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*' // Allow all origins for testing, but restrict in production
        // origin: 'http://localhost:8100',
        // methods: ['GET', 'POST']
    }
});

app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });
    socket.on("draw", (data) => {
        console.log("received draw event, sending to all clients", data);
        socket.broadcast.emit("draw", data);
    })
    socket.on("chat message", (data)=>{
        console.log("received chat message event, sending to all clients", data);
        socket.broadcast.emit("chat message", data);
    })
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});