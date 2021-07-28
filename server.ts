import {createServer} from "http"
import {Server} from "socket.io"
import {Room} from "./lib/room"

const express = require("express")
const mediasoup = require('mediasoup');
const config = require('./config/config.js')
const app = express();
const httpServer = createServer(app);
const {logger} = require('./lib/global');

let workers = [];
let workerIter = 0;
let rooms = new Map();

createWorkers();

const io = new Server(httpServer, {

})

io.of('/room').on("connection", async (socket)=>{
    const {roomId, peerId} = socket.handshake.query;
    const room = await getOrCreateRoom({roomId});
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
        const worker = this.getWorker();
        room = await Room.create({worker , roomId });

        rooms.set(roomId, room);
        room.on('close', () => {
            rooms.delete(roomId);
            logger.info(`room [${roomId}] closed!`);
        });
    }

    return room;
}

async function createWorkers () {
    const {workerNum} = config.mediasoup;

    logger.info(`Running ${workerNum} Workers...`);

    for (let i = 0; i < workerNum; ++i) {
        const worker = await mediasoup.createWorker({
            logLevel   : config.mediasoup.workerSettings.logLevel,
            logTags    : config.mediasoup.workerSettings.logTags,
            rtcMinPort : Number(config.mediasoup.workerSettings.rtcMinPort),
            rtcMaxPort : Number(config.mediasoup.workerSettings.rtcMaxPort)
        })

        worker.on('died', ()=> {
            logger.error(`Worker ${worker.pid} DIED, exiting in 5 secs`);

            setTimeout(() => process.exit(1), 5000);
        })

        workers.push(worker);
        setInterval(async () =>
        {
            const usage = await worker.getResourceUsage();

            logger.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);
    }
}

/**
 * @extension : We can change the algorithm of allocating worker's workload
 */
function getWorker () {
    const worker = workers[workerIter];

    if (++workerIter === workers.length) {
        workerIter = 0;
    }

    return worker;
}
