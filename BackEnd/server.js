import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });

let spreadsheetData = new Map();
const clients = new Map();
const activeUsers = {};

console.log('WebSocket server started on ws://localhost:8080');

wss.on('connection', ws => {
    const userId = generateUserId();
    clients.set(userId, ws);
    activeUsers[userId] = { name: `User-${userId.substring(0, 4)}`, activeCell: null };

    console.log(`Client connected: ${userId}`);

    ws.send(JSON.stringify({
        type: 'initial_data',
        cells: Array.from(spreadsheetData.entries()).map(([id, data]) => ({ id, ...data })),
        activeUsers: activeUsers,
    }));

    broadcast({
        type: 'user_joined',
        userId: userId,
        userName: activeUsers[userId].name,
        activeUsers: activeUsers,
    }, ws);

    ws.on('message', message => {
        try {
            const parsedMessage = JSON.parse(message);
            const { type, userId: msgUserId, cellId, value, userName } = parsedMessage;

            switch (type) {
                case 'cell_update':
                    spreadsheetData.set(cellId, { value: value });
                    broadcast({
                        type: 'cell_update',
                        userId: msgUserId,
                        cellId: cellId,
                        value: value,
                    }, ws);
                    break;

                case 'active_cell':
                    if (activeUsers[msgUserId]) {
                        activeUsers[msgUserId].activeCell = cellId;
                        broadcast({
                            type: 'active_cell',
                            userId: msgUserId,
                            cellId: cellId,
                            activeUsers: activeUsers,
                        }, ws);
                    }
                    break;

                case 'cursor_move': // ✅ New case
                    if (activeUsers[msgUserId]) {
                        activeUsers[msgUserId].activeCell = cellId;
                        broadcast({
                            type: 'cursor_move',
                            userId: msgUserId,
                            cellId: cellId,
                        }, ws);
                    }
                    break;

                case 'user_joined':
                    if (activeUsers[msgUserId] && userName) {
                        activeUsers[msgUserId].name = userName;
                        broadcast({
                            type: 'user_joined',
                            userId: msgUserId,
                            userName: userName,
                            activeUsers: activeUsers,
                        }, ws);
                    }
                    break;

                case 'request_initial_data':
                    ws.send(JSON.stringify({
                        type: 'initial_data',
                        cells: Array.from(spreadsheetData.entries()).map(([id, data]) => ({ id, ...data })),
                        activeUsers: activeUsers,
                    }));
                    break;

                default:
                    console.warn(`Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error('Failed to parse message or handle:', error);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${userId}`);
        clients.delete(userId);
        delete activeUsers[userId];
        broadcast({
            type: 'user_left',
            userId: userId,
            activeUsers: activeUsers,
        });
    });

    ws.on('error', error => {
        console.error(`WebSocket error for ${userId}:`, error);
    });
});

function broadcast(message, senderWs = null) {
    const messageString = JSON.stringify(message);
    clients.forEach((clientWs) => {
        if (clientWs !== senderWs && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(messageString);
        }
    });
}

function generateUserId() {
    return uuidv4();
}


