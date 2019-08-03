# websocket-chat
This is a simple POC that shows how to broadcast "instant" messages across browsers / clients using WebSockets.
The intend of building this POC is just test WebSockets and increase the knowledge about this technology.

![Block diagram](./pics/block-diagram-websockets.png)

![Gif example](./pics/example-usage.gif)

# Installation
1. Install [NodeJS](https://nodejs.org) (version 12+), we recommend doing that using [NVM](https://github.com/nvm-sh/nvm#installation-and-update)
2. Install typescript utils (recommended globally)
```
npm install -g ts-node
npm install -g typescript
```
3. Clone this repo:
```
git clone git@github.com:jordicenzano/websocket-broadcast.git
```
3. Install packages (from the app directory)
```
npm install
```

# Test it
1. Start the backend webSocket server code in a place where the clients can reach, for instance:
```
ts-node ./server/src/ws-chat-server.ts
```
The previous command will run the server in your computer on port 8080 (default)

2. Load this webpage in your device [WebSocketChat](https://github.io/TODO)

3. Type `` as server URL
4. Type `myroom` in ``
5. Type  `RANDOM` in ``
6. Press the "Connect" button
7. Repeat steps 2 to 6 with as many clients as you want
8. Send a message