'use strict'

// Global webSocket
let ws = null;

function toggleConnection() {
    if (ws === null) {
        connectToWSServer();
    }
    else {
        DisconnectFromWSServer();
    }
}

function sendMessage(type) {
    const roomId = document.getElementById("roomid").value;
    const id = document.getElementById("myid").value;
    const msg = document.getElementById("message").value;

    if (typeof(type) !== 'string') {
        type = 'message';
    }
    
    const dataMsg = {"type":type, "room": roomId, "id": id, "msg": msg};

    sendMessageWS(dataMsg);
}

function errorShow(msg) {
    const errMsgElement = document.getElementById("errorMessages");

    const errElement = document.createElement('div');
    errElement.innerHTML = `
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"<span aria-hidden="true">&times;</span></button>
    </div>`;

    errMsgElement.appendChild(errElement);
}

function connectToWSServer() {
    const url = document.getElementById("wsserver").value;
    
    if (!openWS(url)){
        console.error(`Connection error!`);
    }
}

function DisconnectFromWSServer() {
    closeWS();
}

function parseMessage(data) {
    let ret = null;

    try {
        ret = JSON.parse(data);
        if ((ret === null) || (!('msg' in ret)) || (!('id' in ret)) || (!('type' in ret))) {
            throw new Error ('Message malformed')
        }
    }
    catch (err) {
        ret = null;
        console.error(err);
    }

    return ret;
}

function printChatMessage(chatMsg) {
    let msgStr = "";
    
    if ((chatMsg !== null) && (chatMsg.type === 'message')) {
        msgStr = `${chatMsg.id}: ${chatMsg.msg}`;
    }

    if (msgStr !== '') {
        const ta = document.getElementById("room");

        if (ta.value === "") {
            ta.value = msgStr;
        }
        else {
            ta.value = ta.value + '\n' + msgStr;
        }
    }
}

function uiConnected(a) {
    if (a === true) {
        document.getElementById("connectButton").innerHTML = "Disconnect!";
        document.getElementById("connectButton").classList.remove('btn-primary');
        document.getElementById("connectButton").classList.add('btn-warning');
        
        document.getElementById("sendButton").disabled = false;

        document.getElementById("wsserver").disabled = true;
        document.getElementById("roomid").disabled = true;
        document.getElementById("myid").disabled = true;
    }
    else {
        document.getElementById("connectButton").innerHTML = "Connect!";
        document.getElementById("connectButton").classList.remove('btn-warning');
        document.getElementById("connectButton").classList.add('btn-primary');

        document.getElementById("sendButton").disabled = true;

        document.getElementById("wsserver").disabled = false;
        document.getElementById("roomid").disabled = false;
        document.getElementById("myid").disabled = false;
    }
}

function openWS(url) {
    let ret = false;

    closeWS();

    if (ws === null) {
        try {
            ws = new WebSocket(url); // Use protocol ws or wss
            ret = true;

            ws.onopen = function(e) {
                console.log(`Connection established to ${url}`);
                
                // Send ini data (only room is interesting in this message)
                sendMessage('ini');
                console.log(`Sent ini data`);
                
                uiConnected(true);
            };
            
            ws.onmessage = function(event) {
                console.log(`message received: ${event.data}`);

                printChatMessage(parseMessage(event.data));
            };
            
            ws.onclose = function(event) {
                if (event.wasClean) {
                  console.log(`connection closed cleanly, code=${event.code} reason=${event.reason}`);
                }
                else {
                    // e.g. server process killed or network down. event.code is usually 1006 in this case
                    console.warn(`connection died`);
                }
    
                uiConnected(false);
            };
              
            ws.onerror = function(err) {
                console.error(`[ws error] ${err.message}`);
                errorShow(err.message);
            };
        }
        catch(err) {
            console.error(`[error] ${err.message}`);
            errorShow(err.message); 
        }
    }

    return ret;
}

function closeWS() {
    let ret = false;
    
    if (ws != null) {
        ws.close();
        ret = true;
    }

    ws = null;
    
    return ret;
}

function sendMessageWS(msg) {
    let ret = false;

    if (ws != null) {
        ws.send(JSON.stringify(msg));
        ret = true;
    }

    return ret;
}