import {createServer} from "http"
import {Server} from "socket.io"
import {Room} from "./lib/room"
import {DB} from "./mysql/mysql"

const express = require("express");
const mediasoup = require('mediasoup');
const fs = require('fs');
const multer = require('multer')
const config = require('./config/config.js');
const app = express();
const mysqlDB = new DB();

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

const httpServer = createServer(app);

let worker;
mediasoup.createWorker({
    logLevel   : config.mediasoup.workerSettings.logLevel,
    logTags    : config.mediasoup.workerSettings.logTags,
    rtcMinPort : Number(config.mediasoup.workerSettings.rtcMinPort),
    rtcMaxPort : Number(config.mediasoup.workerSettings.rtcMaxPort)
}).then((w)=>{
    worker = w;
});


let rooms = new Map()

const io = new Server(httpServer, {

})

io.of('/room').on("connection", async (socket)=>{
    const {roomId, peerId} = socket.handshake.query
    const room = await getOrCreateRoom({roomId})
    room.handleConnection(peerId, socket)
})

httpServer.listen(4446, function () { console.log('Listening on port 4446') })

async function getOrCreateRoom({ roomId })
{
    let room = rooms.get(roomId);

    // If the Room does not exist create a new one.
    if (!room)
    {
        //logger.info('creating a new Room [roomId:%s]', roomId);
        room = await Room.create({ worker, roomId });

        rooms.set(roomId, room);
        console.log("[RoomList]", rooms.keys())
        room.on('close', () => rooms.delete(roomId));
    }

    return room;
}
