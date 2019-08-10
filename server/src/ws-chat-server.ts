#!/usr/bin/env ts-node

/*
(c) Jordi Cenzano 2019
*/

import { exit } from 'shelljs';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';
import * as uuidv4 from 'uuid/v4';

'use strict'

// Constants
const VERSION:string = '1.0.0';
const APP_NAME = 'ws-chat-server.ts';

// Default port
const DEF_PORT = 8080;

// Extended websocket definition
interface WebSocketExt extends WebSocket {
    name:string
    room:string
}

// Parsed input data interface
interface parsedArgsStruct {
    // Optional params
    printHelp:boolean;
    
    port:number;
}

// Chat message interface
interface chatMessage {
    type:'message'|'ini';
    room:string;
    id:string;
    msg:string;
}

// Aux functions 

function printVersion():void {
    console.log(`${APP_NAME} version ${VERSION}`);
}

function printUsage ():void {
    console.log(`Usage: ${APP_NAME} [options]`);
    console.log(`Example: ${APP_NAME} -p 8080`);
    console.log(`\nOptions:
-h Show help
-p port of the webserver (default: ${DEF_PORT})`);
}

function printError(msg:string): void {
    console.error(msg)
}

function printLog(msg:string): void {
    console.log(msg);
}

function parseArgs(argvs:string[]) {
    const ret:parsedArgsStruct = {
        printHelp: false,
        
        port: DEF_PORT
    };

    let n = 2;
    while (n < argvs.length - 1) {
        if (argvs[n] === '-h') {
            ret.printHelp = true;
            n = n + 1;
        }
        else if (argvs[n] === '-p'){
            ret.port = parseInt(argvs[n + 1]);
            n = n + 2;
        }
        else {
            n++;
        }
    }

    return ret;
}

// Starts WS server
function startWebSocketRepeaterServer(port:number):WebSocket.Server {
    const wsServer = new WebSocket.Server({ port: port });

    wsServer.on('connection', function (newWs:WebSocketExt, req:IncomingMessage) {
        newWs.name = uuidv4();

        configureNewConnection(newWs, req);

        const size = addConnection(newWs);
        printLog(`Connection ${newWs.name} added to the pool, new pool size ${size}`);
    });

    printLog(`WS server listening on port ${port}`);

    return wsServer
}

// Configure each client connection
function configureNewConnection(newWs:WebSocketExt, req:IncomingMessage):void {
    newWs.onclose = function (e:{ wasClean: boolean; code: number; reason: string; target: WebSocketExt }):void {
        const size = removeConnection(e.target);
        printLog(`Connection ${newWs.name} removed from the pool, new pool size ${size}. Extra info (${JSON.stringify(e)})`);
    };

    // It is NOT emmited???? Bug?
    /*
    newWs.onopen = function (e:{ target: WebSocketExt }) {
        const size = addConnection(e.target);
        printLog(`Connection ${e.target.name} added to the pool, new pool size ${size}`);
    };
    */
    
    newWs.onmessage = function(e:{ data: WebSocket.Data; type: string; target: WebSocketExt }):void {
        const numSent = processMessage(e.data, e.target);

        printLog(`Received message from ${e.target.name} and broadcasted to ${numSent} destinations. data => ${e.data}`);
    };

    newWs.onerror = function (e: {error: any, message: string, type: string, target: WebSocketExt }) {
        printError(`WS Error: ${e.message} from ${e.target.name}`)
    }
    
    printLog(`Connection accepted from ${req.connection.remoteAddress}`);
}

// Adds connection to array
function addConnection(newWs:WebSocketExt):number {
    if (newWs.name in wsPool) {
        printError(`Name ${newWs.name} is repeated in the ws pool`);
    }
    else {
        wsPool[newWs.name] = newWs;
    }

    return Object.keys(wsPool).length;
}

// Removes connection from array
function removeConnection(newWs:WebSocketExt):number {
    if (newWs.name in wsPool) {
        delete wsPool[newWs.name];
    }
    else {
        printError(`Name ${newWs.name} NOT found in the ws pool`);
    }

    return Object.keys(wsPool).length;
}

// Process incoming message
function processMessage(message:WebSocket.Data, wsMyself:WebSocketExt):number {
    let numSent = 0;
    let chatMsg:chatMessage|null = parseMessage(message);

    if (chatMsg !== null) {
        if (chatMsg.type === 'ini') {
            // If it is Ini link that connection to a room
            wsMyself.room = chatMsg.room;
            printLog(`Initiated session ${wsMyself.name} to room ${wsMyself.room}`);
        }
        else if (chatMsg.type === 'message') {
            // If is type message: broadcast to all connections in the same room (except myself)
            Object.values(wsPool).forEach (ws => {
                if ((chatMsg !== null) && (wsMyself.name !== ws.name) && (ws.room === chatMsg.room)) {
                    ws.send(message);
                    numSent++;
                }
            });
        }
        else {
            printError(`unknown message type`);
        }
    }
    else {
        printError(`unprocessable message`);
    }

    return numSent;
}

// Parse the incoming message
function parseMessage(message:WebSocket.Data):chatMessage|null {
    let ret:chatMessage|null = null;
    let msgStr = message.toString()
    try {
        let tmp:chatMessage = JSON.parse(msgStr);

        if ((!('room' in tmp)) || (!('id' in tmp)) || (!('msg' in tmp)) || (!('type' in tmp))) {
            throw new Error('Message malformed');
        }

        ret = tmp;
    }
    catch (err) {
        printError(`Can NOT parse message ${msgStr}. Err: ${err}`);
    }

    return ret;
}

// Starts execution!

const parsedArgs:parsedArgsStruct = parseArgs(process.argv);

// Not used var (useful in the future?)
let wsServer:WebSocket.Server|null = null;

const wsPool:{[key:string]:WebSocketExt} = {};

printVersion();

if (parsedArgs.printHelp) {
  printUsage();
  exit(0);
}

wsServer = startWebSocketRepeaterServer(parsedArgs.port);
