import prisma from "@repo/db/client";
import Redis from "ioredis";
import { WebSocketServer, WebSocket } from "ws";
import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config({path: "././.env"});
if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_USERNAME || !process.env.REDIS_PASSWORD) {
    throw new Error("Kafka username and password must be defined in environment variables.");
}
const redisOptions: {
    host: string | undefined;
    port: number | undefined;
    username: string | undefined;
    password: string | undefined;
    maxRetriesPerRequest: number;
}= {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 100,
};

if (!process.env.KAFKA_USERNAME || !process.env.KAFKA_PASSWORD) {
    throw new Error("Kafka username and password must be defined in environment variables.");
  }
const kafka = new Kafka({
    brokers: [`${process.env.KAFKA_BROKERS}`],
    ssl: {
      ca: [fs.readFileSync(path.resolve("./src/service/ca.pem"), "utf-8")],
    },
    sasl: {
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
      mechanism:"plain",
    },
  });
  interface sendmsg{
    roomId: string; uid: string; content: string; 
  }
  let producer: null | Producer = null;
  const admin = kafka.admin();
async function createproducer() {
    if (producer) {
        return producer;
    }
    const _producer=kafka.producer();
    try {
        await _producer.connect();
        producer=_producer;
        return producer;
    } catch (error) {
        throw new Error(`Failed to connect producer: ${error}`);
    }
}
async function producemessage(send:sendmsg){
    try {
        const producer = await createproducer();
        await producer.send({
            topic: 'SendtoDb',//later type of room group or directmsg
            messages: [
                {
                    value:JSON.stringify(send),key: `message-${Date.now()}`
                }
            ],
        });
    } catch (error) {
        console.error(`Failed to send message: ${error}`);
    }
}
async function startMessageConsumer() {
    console.log("Consumer is running..");
    const consumer = kafka.consumer({ groupId: "default" });
    await consumer.connect();
    await consumer.subscribe({ topic: "SendtoDb", fromBeginning: true });
    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if (!message.value) return;
            const final=message.value.toString('utf-8');
            const msg:sendmsg=JSON.parse(final);
        console.log(`New Message Recv..`);
        try {
        const send = await prisma.userMessage.create(
                    {
                        data: {
                            content: msg.content, messageType:"Text",roomId:msg.roomId,uid:msg.uid
                        }
        })
        } catch (err) {
          console.log("Something is wrong");
          pause();
          setTimeout(() => {
            consumer.resume([{ topic: "SendtoDb" }]);
          }, 60 * 1000);
        }
      },
    });
  }
export const pub = new Redis(redisOptions);
export const sub = new Redis(redisOptions);

export class SocketManager {
    private _server: WebSocketServer;
    private clients: Map<WebSocket, string>=new Map();
    private rooms: Map<string, Set<WebSocket>>=new Map();

    constructor(socket: WebSocketServer) {
        this._server = socket;
        this.init();
    }
    private init() {
        //   startMessageConsumer();
        this._server.on("connection", socket => this.handleConnection(socket));
        sub.on("message", (channel, message) =>{
            console.log("REDIS KO GYA TOH HA MSG")
            const parsedMessage = JSON.parse(message);
            const { type  } = parsedMessage;
            if (type=='NewContact') {
                console.log('if condition pass hogyi')
                this.handlepvtredismessage(channel,message)
            }else{
                this.handleredismessage(channel, message)
            }
            })
    }

    private handleConnection(socket: WebSocket) {
        console.log("Client connected");
        this.handleSocketEvents(socket);
    }

    private handleSocketEvents(socket: WebSocket) {
        socket.on('close', () => this.handleClose(socket));
        socket.on("message", message => this.handleMessage(socket, message));
    }

    private handleClose(socket:WebSocket) {
        const userId = this.clients.get(socket);
        console.log("Client "+userId+" disconnected");
        this.clients.delete(socket);
    }
  

    private async handleMessage(socket: WebSocket, message: any) {
        const { type, roomId, data, userId,recId } = JSON.parse(message.toString());

        switch (type) {
            case 'userId':
                this.clients.set(socket, userId);
                break;
            case 'join':
                this.joinRoom(socket, roomId, userId);
                break;
            case 'leave':
                this.leaveRoom(socket, roomId, userId);
                break;
            case 'message':
                await this.broadcastMessage(roomId, userId, data);
                break;
            case 'handlepvtroom':
                this.handleprivate(socket,roomId,userId,recId);
                break;
        }
    }
    private async handleprivate(socket:WebSocket,roomId:string,userId:string,recId:string) {
        //ideally msg should directly send to redis so that you can fetch user from any websocket server
        this.joinRoom(socket,roomId,userId);
        const recSocket = [...this.clients.entries()].find(([_, id]) => id === recId)?.[0];
        if (recSocket) {
            this.joinRoom(recSocket, roomId, recId);
        } else {
            console.log("Recipient is not connected");
        }
        const message={roomId,userId,type:"NewContact"}
        try {
            await pub.publish(roomId,JSON.stringify(message));
        } catch (error) {
            throw new Error("PUBLISHING ERROR");
        }
    }
    private async broadcastMessage(roomId: string, userId: string, data: string) {
        const message = { roomId, userId, data };
        console.log(message);
        await pub.publish(roomId, JSON.stringify(message));
    }
    private handleredismessage = async (channel: any, message: any) => {
        const parsedMessage = JSON.parse(message);
        const { roomId, userId,data  } = parsedMessage;
        let send:sendmsg ={
            content:data,uid:userId,roomId:roomId
        };
        if (channel === roomId) {
            // await producemessage(send);
            if (this.rooms.has(roomId)) {
                this.rooms.get(roomId)?.forEach(client => {
                    if (this.clients.get(client) !== userId && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(send));
                    }
                });
            }
        }
    }
    private handlepvtredismessage = async (channel: any, message: any) => {
        const parsedMessage = JSON.parse(message);
        const { roomId, userId,type  } = parsedMessage;
        let send ={
            type,uid:userId,roomId:roomId
        };
        if (channel === roomId) {
            if (this.rooms.has(roomId)) {
                this.rooms.get(roomId)?.forEach(client => {
                    if (this.clients.get(client) !== userId && client.readyState === WebSocket.OPEN) {
                        console.log('jaa rha hun 3')
                        client.send(JSON.stringify(send));
                    }
                });
            }
        }
    }
    private joinRoom(socket: WebSocket, roomId: string, userId: string) {
        if (!this.rooms.has(roomId)) {
            console.log("Creating new room");
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)?.add(socket);
        console.log(`Client ${userId} joined room ${roomId}`);
        this.subscribeToRedis(roomId);
    }


    private async leaveRoom(socket: WebSocket, roomId: string, userId: string) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId)?.delete(socket);
            if (this.rooms.get(roomId)?.size === 0) {
                this.rooms.delete(roomId);
                sub.unsubscribe(roomId); 
                console.log(`Room ${roomId} is now empty and deleted.`);
            }
        }
    }


    private subscribeToRedis(roomId: string) {
        sub.subscribe(roomId, (err, count) => {
            if (err) {
                console.error("Failed to subscribe to Redis channel:", roomId, "Error:", err);
            } else {
                console.log(`Subscribed to Redis channel ${roomId}. Active subscriptions: ${count}`);
            }
        });
    }
}