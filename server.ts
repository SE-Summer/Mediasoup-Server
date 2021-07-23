import {createServer} from "http"
import {Server} from "socket.io"
import {Room} from "./lib/room"

const express = require("express")
const mediasoup = require('mediasoup');
const config = require('./config/config.js')
const app = express();
const httpServer = createServer(app);
const {logger} = require('./lib/global');

let worker;
mediasoup.createWorker({
    logLevel   : config.mediasoup.workerSettings.logLevel,
    logTags    : config.mediasoup.workerSettings.logTags,
    rtcMinPort : Number(config.mediasoup.workerSettings.rtcMinPort),
    rtcMaxPort : Number(config.mediasoup.workerSettings.rtcMaxPort)
}).then((w)=>{
    worker = w;
});


let rooms = new Map();

const io = new Server(httpServer, {

})

io.of('/room').on("connection", async (socket)=>{
    const {roomId, peerId} = socket.handshake.query
    const room = await getOrCreateRoom({roomId})
    room.handleConnection(peerId, socket);
})


httpServer.listen(4446, function () { logger.info('Listening on port 4446') });

async function getOrCreateRoom({ roomId })
{
    let room = rooms.get(roomId);

    // If the Room does not exist create a new one.
    if (!room)
    {
        //logger.info('creating a new Room [roomId:%s]', roomId);
        room = await Room.create({ worker, roomId });

        rooms.set(roomId, room);
        room.on('close', () => {
            rooms.delete(roomId);
            logger.info(`room [${roomId}] closed!`);
        });
    }

    return room;
}
