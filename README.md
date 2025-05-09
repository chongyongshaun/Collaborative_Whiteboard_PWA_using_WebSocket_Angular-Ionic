﻿# Collaborative Whiteboard App Guide/Wiki

Welcome, this guide is here to help you set it up and get it running
when the code is executed it will serve the webapp on http (port 80) using Nginx and the backend is ran using Nodejs with websocket

---

## Setup Guide (2 Ways)

### Using Docker (Recommended way!!!):

1. (macOS/ Windows) install Docker Desktop https://docs.docker.com/desktop/ <br/>
1.1 (Linux distros) install Docker Engine https://docs.docker.com/engine/install/
2. Start docker, on Windows and macOS just run Docker Desktop, on linux run `sudo systemctl start docker`
3. git clone the repository and `cd` into the clone repo
4. run `docker-compose up` that's it! The web app is now running on port 80 which if on the local machine can be accessed through http://localhost/, if accessing from other devices in the private LAN (same wifi network) look up the local machine's ip using `ipconfig` or `ifconfig` and access it using http://<insert the machine's private ip here> (you can portfoward the ip as well to be accessed outside the LAN however I do not have https or any security protocols configured)

### Running it on development environment (**not served on http!!!**)

1. git clone this repository and `cd` into the project root directory
2. run `npm install` in ./backend/ and ./frontend/ and ./frontend/whiteboard_app/
3. in ./backend run `node server.js`
4. in ./frontend/whiteboard_app/ run `npx ionic serve`, the app will be served on localhost:8100 by default

**(important!!!)** None of the undo, redo and clear functionality will work with this method as redis is not setup, nor is the server.js configured to run with your particular instance of redis. To set up manually: Please setup a redis instance and change the **url** to match your redis instance's url in server.js: <br/>`const redisClient = redis.createClient({ 
    url: process.env.REDIS_URL || 'redis://default:default@localhost:6379'
});`
