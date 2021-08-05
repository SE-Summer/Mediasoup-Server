"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var room_1 = require("./lib/room");
var mysql_1 = require("./mysql/mysql");
var global_1 = require("./lib/global");
var express = require("express");
var mediasoup = require('mediasoup');
var fs = require('fs');
var multer = require('multer');
var config = require('./config/config.js');
var app = express();
var mysqlDB = new mysql_1.DB();
var logger = require('./lib/global').logger;
var httpServer = http_1.createServer(app);
var workers = [];
var workerIter = 0;
var rooms = new Map();
app.use(function (req, res, next) {
    //设置请求头
    res.set({
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS'
    });
    next();
});
app.use(express.json());
app.use('/static', express.static('uploads'));
app.use(multer({ dest: '/tmp/' }).array('file'));
app.get('/users', function (req, res) {
    mysqlDB.getUsers(function (rows) {
        res.status(200).json({
            "users": rows
        });
    });
});
app.post('/getReservations', function (req, res) {
    console.log(req.body);
    var token = req.body.token;
    mysqlDB.getRooms(token, function (err, rows) {
        res.status(200).json({
            "rooms": rows
        });
    });
});
app.post('/register', function (req, res) {
    console.log(req.body);
    var _a = req.body, token = _a.token, nickname = _a.nickname, password = _a.password;
    mysqlDB.register(token, nickname, password, function (err, ok) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else {
            res.status(200).json({
                "status": "OK"
            });
        }
    });
});
app.post('/verify', function (req, res) {
    console.log(req.body);
    var _a = req.body, email = _a.email, verify = _a.verify;
    mysqlDB.verify(email, verify, function (err, token) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else {
            res.status(200).json({
                "status": "OK",
                "token": token
            });
        }
    });
});
app.post('/email', function (req, res) {
    console.log(req.body);
    var email = req.body.email;
    mysqlDB.sendEmail(email, function (err, ok) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else {
            res.status(200).json({});
        }
    });
});
app.post('/login', function (req, res) {
    console.log(req.body);
    var _a = req.body, email = _a.email, password = _a.password;
    mysqlDB.login(email, password, function (err, rows) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else if (rows.length === 0) {
            res.status(401).json({
                "error": "Unauthorized"
            });
        }
        else {
            res.status(200).json({
                "user": rows[0]
            });
        }
    });
});
app.post('/autoLogin', function (req, res) {
    console.log(req.body);
    var token = req.body.token;
    mysqlDB.autoLogin(token, function (err, rows) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else if (rows.length === 0) {
            res.status(401).json({
                "error": "Unauthorized"
            });
        }
        else {
            res.status(200).json({
                "user": rows[0]
            });
        }
    });
});
app.post('/getRoom', function (req, res) {
    console.log(req.body);
    var _a = req.body, id = _a.id, password = _a.password;
    mysqlDB.getRoom(id, password, function (err, room) {
        if (err) {
            res.status(401).json({
                "error": err,
                "room": room
            });
        }
        else {
            res.status(200).json({
                "room": room
            });
        }
    });
});
app.post('/reserve', function (req, res) {
    console.log(req.body);
    var _a = req.body, token = _a.token, password = _a.password, topic = _a.topic, start_time = _a.start_time, end_time = _a.end_time, max_num = _a.max_num;
    mysqlDB.appoint(token, password, start_time, end_time, max_num, topic, function (err, rows) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else {
            res.status(200).json({
                "room": rows[0]
            });
        }
    });
});
app.post('/reserveOther', function (req, res) {
    console.log(req.body);
    var _a = req.body, token = _a.token, roomId = _a.roomId, password = _a.password;
    mysqlDB.reserve(token, roomId, password, function (err, rows) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else {
            res.status(200).json({
                "status": "OK"
            });
        }
    });
});
app.get('/portrait', function (req, res) {
    console.log(req.query);
    var token = req.query.token;
    mysqlDB.getPortrait(token, function (err, rows) {
        if (err) {
            res.status(401).json({
                "error": err
            });
        }
        else {
            res.status(200).json({
                "path": rows
            });
        }
    });
});
app.post('/portrait', function (req, res) {
    var token = req.query.token;
    var filename = require("string-random")(32) + '.' + req.files[0].mimetype.split('/')[1];
    var des_file = "./uploads/portraits/" + filename; //文件名
    console.log(des_file); // 上传的文件信息
    fs.readFile(req.files[0].path, function (err, data) {
        fs.writeFile(des_file, data, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                mysqlDB.savePortrait(token, '/static/portraits/' + filename, function (err, ok) {
                    if (err) {
                        res.status(401).json({
                            "error": err
                        });
                    }
                    else {
                        res.status(200).json({
                            "status": "OK",
                            "filename": filename
                        });
                    }
                });
            }
        });
    });
});
app.post('/file', function (req, res) {
    var token = req.query.token;
    console.log(req.files[0]);
    var filetype = req.files[0].originalname.split('.').pop();
    var filename = require("string-random")(32) + '.' + filetype;
    var des_file = "./uploads/files/" + filename; //文件名
    console.log(des_file); // 上传的文件信息
    fs.readFile(req.files[0].path, function (err, data) {
        fs.writeFile(des_file, data, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                mysqlDB.saveFile(token, '/static/files/' + filename, function (err, ok) {
                    if (err) {
                        res.status(401).json({
                            "error": err
                        });
                    }
                    else {
                        res.status(200).json({
                            "status": "OK",
                            "path": '/static/files/' + filename
                        });
                    }
                });
            }
        });
    });
});
createWorkers();
var io = new socket_io_1.Server(httpServer, {
    pingTimeout: 5000
});
io.of('/room').on("connection", function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, roomId, peerId;
    return __generator(this, function (_b) {
        _a = socket.handshake.query, roomId = _a.roomId, peerId = _a.peerId;
        mysqlDB.isHost(peerId, roomId, function (error, res) { return __awaiter(void 0, void 0, void 0, function () {
            var room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!error) return [3 /*break*/, 1];
                        logger.warn("room " + roomId + " or peer " + peerId + " is illegal!");
                        global_1._notify(socket, 'allowed', { allowed: false });
                        setTimeout(function () {
                            socket.disconnect(true);
                        }, 5000);
                        return [2 /*return*/];
                    case 1: return [4 /*yield*/, getOrCreateRoom({ roomId: roomId, host: res })];
                    case 2:
                        room = _a.sent();
                        if (room == null) {
                            global_1._notify(socket, 'allowed', { allowed: false });
                            setTimeout(function () {
                                socket.disconnect(true);
                            }, 5000);
                            return [2 /*return*/];
                        }
                        global_1._notify(socket, 'allowed', { allowed: true });
                        room.handleConnection(peerId, socket);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
httpServer.listen(4446, function () { logger.info('Listening on port 4446'); });
function getOrCreateRoom(_a) {
    var roomId = _a.roomId, host = _a.host;
    return __awaiter(this, void 0, void 0, function () {
        var room, worker;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    room = rooms.get(roomId);
                    if (!!room) return [3 /*break*/, 2];
                    if (!host) {
                        logger.warn("Host of room " + roomId + " hasn't joined!");
                        return [2 /*return*/, null];
                    }
                    worker = getWorker();
                    return [4 /*yield*/, room_1.Room.create({ worker: worker, roomId: roomId })];
                case 1:
                    room = _b.sent();
                    rooms.set(roomId, room);
                    room.on('close', function () {
                        rooms["delete"](roomId);
                        logger.info("room [" + roomId + "] closed!");
                    });
                    _b.label = 2;
                case 2: return [2 /*return*/, room];
            }
        });
    });
}
function createWorkers() {
    return __awaiter(this, void 0, void 0, function () {
        var workerNum, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    workerNum = config.mediasoup.workerNum;
                    logger.info("Running " + workerNum + " Workers...");
                    _loop_1 = function (i) {
                        var worker;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, mediasoup.createWorker({
                                        logLevel: config.mediasoup.workerSettings.logLevel,
                                        logTags: config.mediasoup.workerSettings.logTags,
                                        rtcMinPort: Number(config.mediasoup.workerSettings.rtcMinPort),
                                        rtcMaxPort: Number(config.mediasoup.workerSettings.rtcMaxPort)
                                    })];
                                case 1:
                                    worker = _b.sent();
                                    worker.on('died', function () {
                                        logger.error("Worker " + worker.pid + " DIED, exiting in 5 secs");
                                        setTimeout(function () { return process.exit(1); }, 5000);
                                    });
                                    workers.push(worker);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < workerNum)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    ++i;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * @extension : We can change the algorithm of allocating worker's workload
 */
function getWorker() {
    var worker = workers[workerIter];
    if (++workerIter === workers.length) {
        workerIter = 0;
    }
    return worker;
}
