import {createServer} from "https"
import {Server} from "socket.io"
import {Room} from "./lib/room"
import {DB} from "./mysql/mysql"
import {request} from "express";
import {_notify} from "./lib/global";

const express = require("express");
const mediasoup = require('mediasoup');
const fs = require('fs');
const multer = require('multer')
const config = require('./config/config.js');
const app = express();
const mysqlDB = new DB();
const {logger} = require('./lib/global');

let options = {
    key:fs.readFileSync('./keys/server.key'),
    cert:fs.readFileSync('./keys/server.crt')
}
const httpsServer = createServer(app);

let workers = [];
let workerIter = 0;
let rooms = new Map();

app.use((req, res, next) => {
    //设置请求头
    res.set({
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
    })
    next()
})
app.use(express.json());
app.use('/static', express.static('uploads'));
app.use(multer({ dest: '/tmp/'}).array('file'));

app.get(
    '/users',
    (req, res)=>{
        mysqlDB.getUsers((rows)=>{
            res.status(200).json({
                "users": rows
            })
        });
    }
)

app.post(
    '/getReservations',
    (req, res)=>{
        console.log(req.body);
        const {token} = req.body;
        mysqlDB.getRooms(token, (err, rows)=>{
            res.status(200).json({
                "rooms": rows
            })
        });
    }
)

app.post(
    '/register',
    (req, res)=>{
        console.log(req.body);
        const {token, nickname, password} = req.body
        mysqlDB.register(token, nickname, password, (err, ok)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else{
                res.status(200).json({
                    "status": "OK"
                })
            }
        });
    }
)

app.post(
    '/verify',
    (req, res)=>{
        console.log(req.body);
        const {email, verify} = req.body
        mysqlDB.verify(email, verify, (err, token)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else{
                res.status(200).json({
                    "status": "OK",
                    "token": token
                })
            }
        });
    }
)

app.post(
    '/email',
    (req, res)=>{
        console.log(req.body);
        const {email} = req.body
        mysqlDB.sendEmail(email, (err, ok)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else{
                res.status(200).json({
                })
            }
        });
    }
)

app.post(
    '/login',
    (req, res)=>{
        console.log(req.body);
        const {email, password} = req.body;
        mysqlDB.login(email, password,(err, rows)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else if(rows.length===0){
                res.status(401).json({
                    "error": "Unauthorized"
                })
            }else{
                res.status(200).json({
                    "user": rows[0]
                })
            }
        });
    }
)

app.post(
    '/autoLogin',
    (req, res)=>{
        console.log(req.body);
        const {token} = req.body;
        mysqlDB.autoLogin(token,(err, rows)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else if(rows.length===0){
                res.status(401).json({
                    "error": "Unauthorized"
                })
            }else{
                res.status(200).json({
                    "user": rows[0]
                })
            }
        });
    }
)

app.post(
    '/getRoom',
    (req, res)=>{
        console.log(req.body);
        const {id, password} = req.body
        mysqlDB.getRoom(id, password,(err, room)=>{
            if (err){
                res.status(401).json({
                    "error": err,
                    "room" : room
                })
            }else{
                res.status(200).json({
                    "room": room
                })
            }
        });
    }
)

app.post(
    '/reserve',
    (req, res)=>{
        console.log(req.body);
        const {token, password, topic, start_time, end_time, max_num} = req.body
        mysqlDB.appoint(token, password, start_time, end_time, max_num, topic, (err, rows)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else{
                res.status(200).json({
                    "room": rows[0]
                })
            }
        });
    }
)

app.post(
    '/reserveOther',
    (req, res)=>{
        console.log(req.body);
        const {token, roomId, password} = req.body
        mysqlDB.reserve(token, roomId, password, (err, rows)=>{
            if (err){
                res.status(401).json({
                    "error": err
                })
            }else{
                res.status(200).json({
                    "status" : "OK",
                })
            }
        });
    }
)

app.get(
    '/portrait',
    (req, res)=>{
        console.log(req.query);
        const token = req.query.token;
        mysqlDB.getPortrait(token, (err, rows)=>{
            if (err){
                res.status(401).json({
                    "error": err,
                })
            }else {
                res.status(200).json({
                    "path": rows,
                })
            }
        });
    }
)

app.post(
    '/portrait',
    (req, res)=>{
        const token = req.query.token
        let filename = require("string-random")(32) + '.' +req.files[0].mimetype.split('/')[1];
        let des_file = "./uploads/portraits/" + filename; //文件名
        console.log(des_file);  // 上传的文件信息
        fs.readFile( req.files[0].path, function (err, data) {  // 异步读取文件内容
            fs.writeFile(des_file, data, function (err) { // des_file是文件名，data，文件数据，异步写入到文件
                if( err ){
                    console.log( err );
                }else{
                    mysqlDB.savePortrait(token, '/static/portraits/'+filename, (err, ok)=>{
                        if (err){
                            res.status(401).json({
                                "error": err
                            })
                        }else{
                            res.status(200).json({
                                "status":"OK",
                                "filename": filename
                            })
                        }
                    });
                }
            });
        });
    }
)

app.post(
    '/file',
    (req, res)=> {
        const token = req.query.token
        console.log(req.files[0]);
        const filetype = req.files[0].originalname.split('.').pop();
        let filename = require("string-random")(32) + '.' + filetype;
        let des_file = "./uploads/files/" + filename; //文件名
        console.log(des_file);  // 上传的文件信息
        fs.readFile(req.files[0].path, function (err, data) {  // 异步读取文件内容
            fs.writeFile(des_file, data, function (err) { // des_file是文件名，data，文件数据，异步写入到文件
                if (err) {
                    console.log(err);
                } else {
                    mysqlDB.saveFile(token, '/static/files/' + filename, (err, ok) => {
                        if (err) {
                            res.status(401).json({
                                "error": err
                            })
                        } else {
                            res.status(200).json({
                                "status": "OK",
                                "path": '/static/files/'+filename
                            })
                        }
                    });
                }
            });
        });
    }
)

createWorkers();

const io = new Server(httpsServer, {
    pingTimeout : 5000,
})

io.of('/room').on("connection", async (socket)=> {
    const {roomId, peerId} = socket.handshake.query;
    mysqlDB.isHost(peerId, roomId, async (error, res) => {
        if (error) {
            logger.warn(`room ${roomId} or peer ${peerId} is illegal!`);
            _notify(socket, 'allowed', {allowed : false});
            setTimeout(() => {
                socket.disconnect(true);
            }, 5000);
            return;
        } else {
            const room = await getOrCreateRoom({roomId, host: res});
            if (room == null) {
                _notify(socket, 'allowed', {allowed : false});
                setTimeout(() => {
                    socket.disconnect(true);
                }, 5000);
                return;
            }
            _notify(socket, 'allowed', {allowed : true});
            room.handleConnection(peerId, socket);
        }
    })
})

httpsServer.listen(4446, function () { logger.info('Listening on port 4446') });
async function getOrCreateRoom({ roomId, host })
{
    let room = rooms.get(roomId);

    // If the Room does not exist create a new one.
    if (!room)
    {
        if (!host) {
            logger.warn(`Host of room ${roomId} hasn't joined!`);
            return null;
        }

        //logger.info('creating a new Room [roomId:%s]', roomId);
        let worker = getWorker();
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
        // setInterval(async () =>
        // {
        //     const usage = await worker.getResourceUsage();
        //
        //     logger.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        // }, 120000);
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
