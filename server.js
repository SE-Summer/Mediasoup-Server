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
var express = require("express");
var mediasoup = require('mediasoup');
var config = require('./config/config.js');
var app = express();
var mysqlDB = new mysql_1.DB();
app.get('/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, mysqlDB.getUsers()];
            case 1:
                users = _a.sent();
                console.log(users);
                return [4 /*yield*/, res.status(200).json({
                        "users": users
                    })];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var httpServer = http_1.createServer(app);
var worker;
mediasoup.createWorker({
    logLevel: config.mediasoup.workerSettings.logLevel,
    logTags: config.mediasoup.workerSettings.logTags,
    rtcMinPort: Number(config.mediasoup.workerSettings.rtcMinPort),
    rtcMaxPort: Number(config.mediasoup.workerSettings.rtcMaxPort)
}).then(function (w) {
    worker = w;
});
var rooms = new Map();
var io = new socket_io_1.Server(httpServer, {});
io.of('/room').on("connection", function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, roomId, peerId, room;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = socket.handshake.query, roomId = _a.roomId, peerId = _a.peerId;
                return [4 /*yield*/, getOrCreateRoom({ roomId: roomId })];
            case 1:
                room = _b.sent();
                room.handleConnection(peerId, socket);
                return [2 /*return*/];
        }
    });
}); });
httpServer.listen(4446, function () { console.log('Listening on port 4442'); });
function getOrCreateRoom(_a) {
    var roomId = _a.roomId;
    return __awaiter(this, void 0, void 0, function () {
        var room;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    room = rooms.get(roomId);
                    if (!!room) return [3 /*break*/, 2];
                    return [4 /*yield*/, room_1.Room.create({ worker: worker, roomId: roomId })];
                case 1:
                    //logger.info('creating a new Room [roomId:%s]', roomId);
                    room = _b.sent();
                    rooms.set(roomId, room);
                    console.log("[RoomList]", rooms.keys());
                    room.on('close', function () { return rooms["delete"](roomId); });
                    _b.label = 2;
                case 2: return [2 /*return*/, room];
            }
        });
    });
}
