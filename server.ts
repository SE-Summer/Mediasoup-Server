const express = require("express")
const mediasoup = require('mediasoup');
const config = require('./config/config.js')
import {createServer} from "http"
import {Server} from "socket.io"
import {Room} from "./lib/room"

const app = express();
const httpServer = createServer(app);

const worker = mediasoup.createWorker(config.mediasoup.workerSettings);
let rooms = new Map<String, Room>()

const io = new Server(httpServer, {

})

io.of('/room').on("connection", async (socket)=>{
    const room:Room = await getOrCreateRoom({roomId:'123456'})
    socket.emit('room', {roomId:'123456'})

    room.handleConnection('peer-test', socket)
})


httpServer.listen(55555)

async function getOrCreateRoom({ roomId })
{
    let room = rooms.get(roomId);

    // If the Room does not exist create a new one.
    if (!room)
    {
        //logger.info('creating a new Room [roomId:%s]', roomId);
        room = await Room.create({ worker, roomId });

        rooms.set(roomId, room);
        room.on('close', () => rooms.delete(roomId));
    }

    return room;
}
