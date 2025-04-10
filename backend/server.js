const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

const DEFAULT_EXPIRATION = 60 * 60 * 24;//1d in s

const redisClient = redis.createClient({ //createClient to connect to redis
    socket: {
        host: 'localhost',
        port: 6379
    }
});
//debugging redis connection for when connect or error
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Redis connection failed:', err));

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*' //allow everything for testing
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
    socket.on('draw', (data) => {
        console.log("Received canvas update from", data.sender);
        // Only update Redis if the draw event is not from an undo/redo action
        if (data.sender !== 'server') {
            canvasUpdate(data);
        }
        socket.broadcast.emit('draw', data);
    });
    socket.on("chat message", (data) => {
        console.log("received chat message event, sending to all clients", data);
        socket.broadcast.emit("chat message", data);
    })

    const canvasUpdate = (data) => {
        console.log("attempting to update canvas image to redis...");
        redisClient.RPUSH("undoStack", JSON.stringify(data)).then((res) => {
            redisClient.LTRIM("undoStack", 0, 10).then((res) => { //keep only 10 images in the list
                console.log("canvas image updated to redis", res);
            }).catch((err) => {
                console.error("Error trimming redis list", err);
            });
            redisClient.LLEN('redoStack').then((len) => {
                if (len > 0) {
                    //get rid of all redo stack content if there's any
                    redisClient.DEL('redoStack').then((res) => {
                        console.log("deleted redis redo stack", res);
                    }).catch((err) => {
                        console.error("Error deleting redis redo stack", err);
                    });
                }
            }).catch((err) => {
                console.error("Error getting redis list length", err);
            })
        }
        ).catch((err) => {
            console.error("Error updating canvas image to redis", err);
        });
    }

    socket.on('undo request', () => {
        redisClient.LLEN('undoStack').then((len) => {
            if (len > 1) {
                redisClient.RPOP("undoStack").then((imageData) => {
                    if (imageData) {
                        console.log("canvas image popped from redis undo stack");
                        redisClient.RPUSH('redoStack', imageData).then((res) => {
                            console.log("canvas image pushed to redo stack", res);
                        }).catch((err) => {
                            console.error("Error pushing canvas image to redo stack", err);
                        });
                        //the first one popped off, now peek the top of the stack and send to client
                        redisClient.LINDEX('undoStack', -1).then((imageData) => {
                            if (imageData) {
                                console.log("canvas image peeked from redis undo stack", imageData);
                                socket.emit('undo response', JSON.parse(imageData)); //send the top of the stack to the client that requested it
                            } else {
                                console.log("no canvas image in redis to peek");
                                socket.emit('undo response', null); //send null to the client that requested it
                            }
                        }).catch((err) => {
                            console.error("Error peeking canvas image from redis", err);
                            socket.emit('undo response', null); //send null to the client that requested it
                        })
                    } else {
                        console.log("no canvas image in redis to pop");
                        socket.emit('undo response', null); //send null to the client that requested it
                    }
                }).catch((err) => {
                    console.error("Error popping canvas image from redis", err);
                    socket.emit('undo response', null); //send null to the client that requested it
                });
            }
        }).catch((err) => {
            console.error("Error getting redis list length", err);
            socket.emit('undo response', null); //send null to the client that requested it
        })
    })

    socket.on('redo request', () => {
        redisClient.RPOP("redoStack").then((imageData) => {
            if (imageData) {
                console.log("canvas image popped from redis redo stack");
                redisClient.RPUSH('undoStack', imageData).then((res) => {
                    console.log("canvas image pushed to undo stack", res);
                }).catch((err) => {
                    console.error("Error pushing canvas image to undo stack", err);
                });
                socket.emit('redo response', JSON.parse(imageData));
            } else {
                console.log("no canvas image in redis redo stack to pop");
                socket.emit('redo response', null); //send null to the client that requested it
            }
        }).catch((err) => {
            console.error("Error popping canvas image from redis redo stack", err);
            socket.emit('redo response', null); //send null to the client that requested it
        })
    })

    socket.on('clear canvas request', () => {
        redisClient.FLUSHALL().then((res) => {
            console.log("cleared redis cache:", res);
            socket.emit('clear canvas response', true); //send true to the client that requested it
        }).catch((err) => {
            console.error("Error clearing redis cache", err);
            socket.emit('clear canvas response', false); //oppposite
        })
    })
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});