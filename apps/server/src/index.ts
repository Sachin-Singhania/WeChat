import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

import { SocketManager } from './service/chatmanager';
dotenv.config({path: "./.env"});
const httpServer = http.createServer();
const PORT = process.env.PORT ? process.env.PORT : 8000;
console.log(PORT);
const wss = new WebSocketServer({ server:httpServer });
const socket = new SocketManager(wss);
httpServer.listen(PORT, function() {
    console.log(` Server is listening on port ${PORT}`);
});

