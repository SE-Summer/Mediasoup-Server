"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Room = void 0;
var peerImpl_1 = require("./peerImpl");
var global_1 = require("./global");
var mysql_1 = require("../mysql/mysql");
var global_2 = require("./global");
var EventEmitter = require('events').EventEmitter;
var config = require('../config/config');
var logger = require('./global').logger;
var mysqlDB = new mysql_1.DB();
var Room = /** @class */ (function (_super) {
    __extends(Room, _super);
    function Room(_a) {
        var roomId = _a.roomId, router = _a.router;
        var _this = _super.call(this) || this;
        _this.setMaxListeners(Infinity);
        _this._roomId = roomId;
        _this._closed = false;
        _this._router = router;
        _this._peers = new Map();
        _this._host = null;
        return _this;
    }
    Room.create = function (_a) {
        var worker = _a.worker, roomId = _a.roomId;
        return __awaiter(this, void 0, void 0, function () {
            var mediaCodecs, router;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        logger.info("Create Room " + roomId);
                        mediaCodecs = config.mediasoup.routerOptions.mediaCodecs;
                        return [4 /*yield*/, worker.createRouter({ mediaCodecs: mediaCodecs })];
                    case 1:
                        router = _b.sent();
                        return [2 /*return*/, new Room({
                                roomId: roomId,
                                router: router
                            })];
                }
            });
        });
    };
    Room.prototype._getJoinedPeers = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.excludePeer, excludePeer = _c === void 0 ? undefined : _c;
        if (excludePeer === undefined) {
            return this._peers;
        }
        var filteredPeers = new Map(this._peers);
        filteredPeers["delete"](excludePeer.id);
        return filteredPeers;
    };
    Room.prototype.createConsumer = function (consumerPeer, producerPeer, producer) {
        return __awaiter(this, void 0, void 0, function () {
            var consumer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!consumerPeer) {
                            throw new Error("peer with id \"" + consumerPeer.id + "\" does not exist");
                        }
                        if (!consumerPeer.getPeerInfo().rtpCapabilities) {
                            throw new Error("peer " + consumerPeer.id + " does not have rtpCapabilities");
                        }
                        if (!this._router.canConsume({
                            producerId: producer.id,
                            rtpCapabilities: consumerPeer.getPeerInfo().rtpCapabilities
                        })) {
                            throw new Error("Can not consume peer : " + producerPeer.id + " 's producer : " + producer.id + " : ");
                        }
                        logger.info("create consumer of " + producerPeer.id + " for " + consumerPeer.id);
                        return [4 /*yield*/, consumerPeer.getConsumerTransport().consume({
                                producerId: producer.id,
                                rtpCapabilities: consumerPeer.getPeerInfo().rtpCapabilities
                            })];
                    case 1:
                        consumer = _a.sent();
                        consumerPeer.setConsumer(consumer.id, consumer);
                        consumer.on('transportclose', function () {
                            logger.info("Consumer of peer " + consumerPeer.id + " Closed because of transport closed");
                            consumerPeer.deleteConsumer(consumer.id);
                        });
                        consumer.on('producerclose', function () {
                            logger.info("Consumer of peer " + consumerPeer.id + " Closed because of producer of peer " + producerPeer.id + " closed");
                            consumerPeer.deleteConsumer(consumer.id);
                            global_2._notify(consumerPeer.socket, 'consumerClosed', { consumerId: consumer.id });
                        });
                        consumer.on('producerpause', function () {
                            logger.info("Consumer of peer " + consumerPeer.id + " Paused because of producer of peer " + producerPeer.id + " paused!");
                            global_2._notify(consumerPeer.socket, 'consumerPaused', { consumerId: consumer.id });
                        });
                        consumer.on('producerresume', function () {
                            logger.info("Consumer of peer " + consumerPeer.id + " Resumed because of producer of peer " + producerPeer.id + " resumed!");
                            global_2._notify(consumerPeer.socket, 'consumerResumed', { consumerId: consumer.id });
                        });
                        global_2._notify(consumerPeer.socket, 'newConsumer', {
                            producerPeerId: producerPeer.id,
                            kind: producer.kind,
                            producerId: producer.id,
                            consumerId: consumer.id,
                            rtpParameters: consumer.rtpParameters,
                            type: consumer.type
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Room.prototype.createDataConsumer = function (consumerPeer, producerPeer, dataProducer) {
        return __awaiter(this, void 0, void 0, function () {
            var dataConsumer;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!consumerPeer) {
                            throw new Error("peer with id \"" + consumerPeer.id + "\" does not exist");
                        }
                        logger.info("create data consumer of " + producerPeer.id + " for " + consumerPeer.id);
                        return [4 /*yield*/, producerPeer.getConsumerTransport().consumeData({
                                dataProducerId: dataProducer.id
                            })];
                    case 1:
                        dataConsumer = _a.sent();
                        consumerPeer.setDataConsumer(dataConsumer.id, dataConsumer);
                        dataConsumer.on("transportclose", function () {
                            logger.info("Data Consumer of peer " + consumerPeer.id + " Closed because of transport closed!");
                            consumerPeer.deleteDataConsumer(dataConsumer.id);
                        });
                        dataConsumer.on('dataproducerclose', function () {
                            logger.info("Data Consumer of peer " + consumerPeer.id + " Closed because of producer of peer " + producerPeer.id + " closed!");
                            consumerPeer.deleteDataConsumer(dataConsumer.id);
                            dataConsumer.close();
                            global_2._notify(consumerPeer.socket, 'dataConsumerClosed', {
                                dataConsumerId: dataConsumer.id
                            }, true, _this._roomId);
                        });
                        global_2._notify(consumerPeer.socket, 'newDataConsumer', {
                            producerPeerId: producerPeer.id,
                            dataProducerId: dataProducer.id,
                            dataConsumerId: dataConsumer.id,
                            sctpParameters: dataConsumer.sctpStreamParameters,
                            protocol: dataConsumer.protocol,
                            label: dataConsumer.label
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Room.prototype.handleConnection = function (peerId, socket) {
        var _this = this;
        var peer;
        if (this._peers.has(peerId)) {
            peer = this._peers.get(peerId);
            logger.info("peer " + peerId + " reconnect");
            peer.socket = socket;
        }
        else {
            peer = new peerImpl_1.PeerImpl(peerId, socket);
            this._peers.set(peerId, peer);
        }
        socket.on('request', function (request, callback) {
            _this._handleRequest(peer, request, callback)["catch"](function (error) {
                logger.warn("request failed [" + error + "]");
                callback(error, {});
            });
        });
        socket.on('disconnect', function () {
            logger.info("Peer " + peer.id + " disconnected!");
        });
        peer.on('close', function () {
            global_2._notify(socket, 'peerClosed', {
                peerId: peerId
            }, true, _this._roomId);
            _this._peers["delete"](peerId);
            peer.socket.leave(_this._roomId);
            logger.info("Peer " + peerId + " closed");
            peer.socket.disconnect(true);
            if (_this._peers.size === 0) {
                _this.close();
            }
        });
    };
    Room.prototype._handleRequest = function (peer, request, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, displayName_1, avatar_1, joined, device_1, rtpCapabilities_1, sctpCapabilities_1, error, error, error, host_1, _c, sctpCapabilities, transportType, webRtcTransportOptions, transport_1, _d, transportId, dtlsParameters, transport, _e, transportId, kind, rtpParameters, appData, transport, error, producer_1, joinedPeers, _f, transportId, sctpStreamParameters, protocol, transport, dataProducer_1, joinedPeers, producerId, producer, error, producerId, producer, error, producerId, producer, error, consumerId, consumer, error, consumerId, consumer, error, _g, toPeerId, timestamp, text, message, recvPeer, error, _h, fileURL, timestamp, filename, fileType, message, kickedPeerId, error, kickedPeer, mutedPeerId, error, _i, _j, peer_1, _k, _l, audio, mutedPeer, error, _m, _o, audio, hostId_1, error, newHost_1, error, transportId, transport, error, iceParameters, error;
            var _this = this;
            return __generator(this, function (_p) {
                switch (_p.label) {
                    case 0:
                        _a = request.method;
                        switch (_a) {
                            case global_1.RequestMethod.getRouterRtpCapabilities: return [3 /*break*/, 1];
                            case global_1.RequestMethod.join: return [3 /*break*/, 2];
                            case global_1.RequestMethod.createTransport: return [3 /*break*/, 3];
                            case global_1.RequestMethod.connectWebRtcTransport: return [3 /*break*/, 5];
                            case global_1.RequestMethod.produce: return [3 /*break*/, 7];
                            case global_1.RequestMethod.produceData: return [3 /*break*/, 9];
                            case global_1.RequestMethod.closeProducer: return [3 /*break*/, 14];
                            case global_1.RequestMethod.pauseProducer: return [3 /*break*/, 15];
                            case global_1.RequestMethod.resumeProducer: return [3 /*break*/, 17];
                            case global_1.RequestMethod.pauseConsumer: return [3 /*break*/, 19];
                            case global_1.RequestMethod.resumeConsumer: return [3 /*break*/, 21];
                            case global_1.RequestMethod.sendText: return [3 /*break*/, 23];
                            case global_1.RequestMethod.sendFile: return [3 /*break*/, 24];
                            case global_1.RequestMethod.close: return [3 /*break*/, 25];
                            case global_1.RequestMethod.kick: return [3 /*break*/, 26];
                            case global_1.RequestMethod.mute: return [3 /*break*/, 27];
                            case global_1.RequestMethod.transferHost: return [3 /*break*/, 39];
                            case global_1.RequestMethod.restartIce: return [3 /*break*/, 40];
                        }
                        return [3 /*break*/, 42];
                    case 1:
                        {
                            callback(null, this._router.rtpCapabilities);
                            return [3 /*break*/, 43];
                        }
                        _p.label = 2;
                    case 2:
                        {
                            _b = request.data, displayName_1 = _b.displayName, avatar_1 = _b.avatar, joined = _b.joined, device_1 = _b.device, rtpCapabilities_1 = _b.rtpCapabilities, sctpCapabilities_1 = _b.sctpCapabilities;
                            if (!rtpCapabilities_1) {
                                error = "peer " + peer.id + " does not have rtpCapabilities!";
                                callback(error);
                                throw Error(error);
                            }
                            if (!rtpCapabilities_1) {
                                error = "peer " + peer.id + " does not have rtpCapabilities!";
                                callback(error);
                                throw Error(error);
                            }
                            if (joined) {
                                error = "peer " + peer.id + " is already joined";
                                callback(error);
                                throw Error(error);
                            }
                            host_1 = false;
                            mysqlDB.isHost(peer.id, this._roomId, function (error, res) { return __awaiter(_this, void 0, void 0, function () {
                                var joinedPeers, peerInfos_1;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    if (error) {
                                        callback(error);
                                        throw Error(error);
                                    }
                                    else {
                                        host_1 = res;
                                        if (host_1) {
                                            logger.info("Join : [Host] " + peer.id);
                                            this._host = peer;
                                        }
                                        else {
                                            logger.info("Join : [Member] " + peer.id + "!");
                                        }
                                        peer.setPeerInfo({
                                            displayName: displayName_1,
                                            avatar: avatar_1,
                                            joined: true,
                                            closed: false,
                                            device: device_1,
                                            rtpCapabilities: rtpCapabilities_1,
                                            sctpCapabilities: sctpCapabilities_1
                                        });
                                        global_2._notify(peer.socket, 'newPeer', {
                                            id: peer.id,
                                            displayName: displayName_1,
                                            avatar: avatar_1,
                                            device: device_1
                                        }, true, this._roomId);
                                        peer.socket.join(this._roomId);
                                        this._peers.set(peer.id, peer);
                                        joinedPeers = this._getJoinedPeers({ excludePeer: peer });
                                        peerInfos_1 = [];
                                        joinedPeers.forEach(function (joinedPeer) {
                                            peerInfos_1.push({
                                                id: joinedPeer.id,
                                                displayName: joinedPeer.displayName,
                                                avatar: joinedPeer.avatar,
                                                device: joinedPeer.device
                                            });
                                            joinedPeer.getAllProducer().forEach(function (producer) {
                                                _this.createConsumer(peer, joinedPeer, producer);
                                            });
                                            joinedPeer.getAllDataProducer().forEach(function (dataProducer) {
                                                _this.createDataConsumer(peer, joinedPeer, dataProducer);
                                            });
                                        });
                                        callback(null, {
                                            host: this._host.id,
                                            peerInfos: peerInfos_1
                                        });
                                    }
                                    return [2 /*return*/];
                                });
                            }); });
                            return [3 /*break*/, 43];
                        }
                        _p.label = 3;
                    case 3:
                        _c = request.data, sctpCapabilities = _c.sctpCapabilities, transportType = _c.transportType;
                        logger.info("Create " + transportType + " Transport : peer " + peer.id);
                        if (transportType !== 'consumer' && transportType !== 'producer') {
                            callback('transport type ERROR!', { sendType: transportType });
                            callback('transport type ERROR!', { sendType: transportType });
                            return [3 /*break*/, 43];
                        }
                        webRtcTransportOptions = __assign(__assign({}, config.mediasoup.webRtcTransportOptions), { enableSctp: Boolean(sctpCapabilities), numSctpStreams: (sctpCapabilities || {}).numStreams, appData: {
                                transportType: transportType
                            } });
                        return [4 /*yield*/, this._router.createWebRtcTransport(webRtcTransportOptions)];
                    case 4:
                        transport_1 = _p.sent();
                        peer.setTransport(transport_1.id, transport_1);
                        transport_1.on('routerclose', function () {
                            peer.deleteTransport(transport_1.id);
                            logger.info("transport " + transport_1.id + " closed because of router closed!");
                        });
                        callback(null, {
                            id: transport_1.id,
                            iceParameters: transport_1.iceParameters,
                            iceCandidates: transport_1.iceCandidates,
                            dtlsParameters: transport_1.dtlsParameters,
                            sctpParameters: transport_1.sctpParameters
                        });
                        return [3 /*break*/, 43];
                    case 5:
                        _d = request.data, transportId = _d.transportId, dtlsParameters = _d.dtlsParameters;
                        transport = peer.getTransport(transportId);
                        logger.info("Connect " + transport.appData.transportType + " Transport : peer " + peer.id);
                        return [4 /*yield*/, transport.connect({ dtlsParameters: dtlsParameters })];
                    case 6:
                        _p.sent();
                        callback(null, {});
                        return [3 /*break*/, 43];
                    case 7:
                        logger.info("Produce : peer " + peer.id);
                        _e = request.data, transportId = _e.transportId, kind = _e.kind, rtpParameters = _e.rtpParameters;
                        appData = request.data.appData;
                        transport = peer.getTransport(transportId);
                        if (!transport) {
                            error = "transport with id \"" + transportId + "\" not found";
                            callback(error, {});
                            return [3 /*break*/, 43];
                        }
                        appData = __assign(__assign({}, appData), { peerId: peer.id });
                        return [4 /*yield*/, transport.produce({ kind: kind, rtpParameters: rtpParameters, appData: appData })];
                    case 8:
                        producer_1 = _p.sent();
                        peer.setProducer(producer_1.id, producer_1);
                        callback(null, { producerId: producer_1.id });
                        joinedPeers = this._getJoinedPeers({ excludePeer: peer });
                        joinedPeers.forEach(function (joinedPeer) {
                            _this.createConsumer(joinedPeer, peer, producer_1);
                        });
                        return [3 /*break*/, 43];
                    case 9:
                        logger.info("Produce Data : peer " + peer.id);
                        _f = request.data, transportId = _f.transportId, sctpStreamParameters = _f.sctpStreamParameters, protocol = _f.protocol;
                        transport = peer.getTransport(transportId);
                        if (!transport) {
                            throw new Error("Transport with id " + transportId + " does not exist!");
                        }
                        if (!(sctpStreamParameters === undefined)) return [3 /*break*/, 11];
                        return [4 /*yield*/, transport.produceData({
                                protocol: protocol
                            })];
                    case 10:
                        dataProducer_1 = _p.sent();
                        return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, transport.produceData({
                            sctpStreamParameters: sctpStreamParameters,
                            protocol: protocol
                        })];
                    case 12:
                        dataProducer_1 = _p.sent();
                        _p.label = 13;
                    case 13:
                        peer.setDataProducer(dataProducer_1.id, dataProducer_1);
                        callback(null, { id: dataProducer_1.id });
                        joinedPeers = this._getJoinedPeers({ excludePeer: peer });
                        joinedPeers.forEach(function (joinedPeer) {
                            _this.createDataConsumer(joinedPeer, peer, dataProducer_1);
                        });
                        return [3 /*break*/, 43];
                    case 14:
                        {
                            producerId = request.data.producerId;
                            producer = peer.getProducer(producerId);
                            if (!producer) {
                                error = "producer with id \"" + producerId + "\" not found";
                                callback(error, {});
                                throw new Error(error);
                            }
                            logger.info("Close producer : peer " + peer.id + ", producer " + producerId);
                            producer.close();
                            peer.deleteProducer(producer.id);
                            callback();
                            return [3 /*break*/, 43];
                        }
                        _p.label = 15;
                    case 15:
                        producerId = request.data.producerId;
                        producer = peer.getProducer(producerId);
                        if (!producer) {
                            error = "producer with id \"" + producerId + "\" not found";
                            callback(error, {});
                            throw new Error(error);
                        }
                        logger.info("Pause producer : peer " + peer.id + ", producer " + producerId);
                        return [4 /*yield*/, producer.pause()];
                    case 16:
                        _p.sent();
                        callback();
                        return [3 /*break*/, 43];
                    case 17:
                        producerId = request.data.producerId;
                        producer = peer.getProducer(producerId);
                        if (!producer) {
                            error = "producer with id \"" + producerId + "\" not found";
                            callback(error, {});
                            throw new Error(error);
                        }
                        logger.info("Resume producer : peer " + peer.id + ", producer " + producerId);
                        return [4 /*yield*/, producer.resume()];
                    case 18:
                        _p.sent();
                        callback();
                        return [3 /*break*/, 43];
                    case 19:
                        consumerId = request.data.consumerId;
                        consumer = peer.getConsumer(consumerId);
                        if (!consumer) {
                            error = "consumer with id \"" + consumerId + "\" not found";
                            callback(error, {});
                            throw new Error(error);
                        }
                        logger.info("Pause consumer : peer " + peer.id + ", consumer " + consumerId);
                        return [4 /*yield*/, consumer.pause()];
                    case 20:
                        _p.sent();
                        callback();
                        return [3 /*break*/, 43];
                    case 21:
                        consumerId = request.data.consumerId;
                        consumer = peer.getConsumer(consumerId);
                        if (!consumer) {
                            error = "consumer with id \"" + consumerId + "\" not found";
                            callback(error, {});
                            throw new Error(error);
                        }
                        logger.info("Resume consumer : peer " + peer.id + ", consumer " + consumerId);
                        return [4 /*yield*/, consumer.resume()];
                    case 22:
                        _p.sent();
                        callback();
                        return [3 /*break*/, 43];
                    case 23:
                        {
                            _g = request.data, toPeerId = _g.toPeerId, timestamp = _g.timestamp, text = _g.text;
                            message = {
                                fromPeerId: peer.id,
                                broadcast: true,
                                timestamp: timestamp,
                                text: text
                            };
                            if (toPeerId == null) {
                                logger.info("SendText : peer " + peer.id + " broadcast text");
                                global_2._notify(peer.socket, 'newText', message, true, this._roomId);
                                callback(null);
                                logger.debug("" + text);
                            }
                            else {
                                recvPeer = this._peers.get(toPeerId);
                                if (!recvPeer) {
                                    error = "receive peer " + toPeerId + " does NOT exist!";
                                    callback(error);
                                    throw Error(error);
                                }
                                logger.info("SendText : peer " + peer.id + " send text to " + toPeerId);
                                message.broadcast = false;
                                global_2._notify(recvPeer.socket, 'newText', message);
                                logger.debug("" + text);
                                callback(null);
                            }
                            return [3 /*break*/, 43];
                        }
                        _p.label = 24;
                    case 24:
                        {
                            _h = request.data, fileURL = _h.fileURL, timestamp = _h.timestamp, filename = _h.filename, fileType = _h.fileType;
                            logger.info("Send File : peer " + peer.id);
                            message = {
                                fromPeerId: peer.id,
                                fileURL: fileURL,
                                timestamp: timestamp,
                                filename: filename,
                                fileType: fileType
                            };
                            global_2._notify(peer.socket, 'newFile', message, true, this._roomId);
                            callback(null);
                            return [3 /*break*/, 43];
                        }
                        _p.label = 25;
                    case 25:
                        {
                            console.log(this._peers.size);
                            if (this._host === peer) {
                                logger.info("Host " + peer.id + " Exit, room closed!");
                                global_2._notify(peer.socket, 'roomClosed', null, true, this._roomId);
                                callback();
                                this.close();
                                return [3 /*break*/, 43];
                            }
                            logger.info("Member Exit : " + peer.id + "!");
                            callback();
                            peer.setPeerInfo({
                                displayName: undefined,
                                avatar: undefined,
                                joined: false,
                                closed: true,
                                device: undefined,
                                rtpCapabilities: undefined,
                                sctpCapabilities: undefined
                            });
                            peer.close();
                            return [3 /*break*/, 43];
                        }
                        _p.label = 26;
                    case 26:
                        {
                            kickedPeerId = request.data.kickedPeerId;
                            if (peer !== this._host) {
                                error = "Peer " + peer.id + " is not the HOST!";
                                callback(error);
                                throw Error(error);
                            }
                            logger.info("Kick : " + kickedPeerId);
                            kickedPeer = this._peers.get(kickedPeerId);
                            kickedPeer.close();
                            callback();
                            return [3 /*break*/, 43];
                        }
                        _p.label = 27;
                    case 27:
                        mutedPeerId = request.data.mutedPeerId;
                        if (peer !== this._host) {
                            error = "Peer " + peer.id + " is not the HOST!";
                            callback(error);
                            throw Error(error);
                        }
                        if (!(mutedPeerId === "all")) return [3 /*break*/, 34];
                        logger.info("Mute : mute all members except host");
                        _i = 0, _j = this._peers;
                        _p.label = 28;
                    case 28:
                        if (!(_i < _j.length)) return [3 /*break*/, 33];
                        peer_1 = _j[_i];
                        if (!(peer_1 !== this._host)) return [3 /*break*/, 32];
                        _k = 0, _l = peer_1.getAllAudioProducer();
                        _p.label = 29;
                    case 29:
                        if (!(_k < _l.length)) return [3 /*break*/, 32];
                        audio = _l[_k];
                        global_2._notify(peer_1.socket, 'beMuted');
                        return [4 /*yield*/, audio.pause()];
                    case 30:
                        _p.sent();
                        _p.label = 31;
                    case 31:
                        _k++;
                        return [3 /*break*/, 29];
                    case 32:
                        _i++;
                        return [3 /*break*/, 28];
                    case 33:
                        callback();
                        return [3 /*break*/, 43];
                    case 34:
                        mutedPeer = this._peers.get(mutedPeerId);
                        if (!mutedPeer) {
                            error = "peer " + mutedPeerId + " does NOT exist!";
                            callback(error);
                            throw Error(error);
                        }
                        logger.info("Mute : peer " + peer.id + " is muted.");
                        _m = 0, _o = mutedPeer.getAllAudioProducer();
                        _p.label = 35;
                    case 35:
                        if (!(_m < _o.length)) return [3 /*break*/, 38];
                        audio = _o[_m];
                        global_2._notify(peer.socket, 'muted');
                        return [4 /*yield*/, audio.pause()];
                    case 36:
                        _p.sent();
                        _p.label = 37;
                    case 37:
                        _m++;
                        return [3 /*break*/, 35];
                    case 38:
                        callback();
                        return [3 /*break*/, 43];
                    case 39:
                        {
                            hostId_1 = request.data.hostId;
                            if (peer !== this._host) {
                                error = "peer " + peer.id + " is not the HOST";
                                callback(error);
                                throw Error(error);
                            }
                            newHost_1 = this._peers.get(hostId_1);
                            if (!newHost_1) {
                                error = "peer " + hostId_1 + " is NOT exist";
                                callback(error);
                                throw Error(error);
                            }
                            mysqlDB.setHost(hostId_1, this._roomId, function (error, res) {
                                if (res) {
                                    logger.info("TransferHost : transfer host from " + peer.id + " to " + hostId_1);
                                    _this._host = newHost_1;
                                    global_2._notify(newHost_1.socket, 'hostChanged', { newHostId: hostId_1 }, true, _this._roomId);
                                    callback();
                                }
                                else {
                                    callback(error);
                                    throw Error(error);
                                }
                            });
                            return [3 /*break*/, 43];
                        }
                        _p.label = 40;
                    case 40:
                        transportId = request.data.transportId;
                        transport = peer.getTransport(transportId);
                        if (!transport) {
                            error = "peer " + peer.id + " restart transport failed";
                            callback(error);
                            throw Error(error);
                        }
                        logger.info("Restart Ice : peer " + peer.id + " restart " + transport.appData.transportType);
                        return [4 /*yield*/, transport.restartIce()];
                    case 41:
                        iceParameters = _p.sent();
                        callback(null, {
                            iceParameters: iceParameters
                        });
                        return [3 /*break*/, 43];
                    case 42:
                        {
                            error = "Unknown Request " + request.method;
                            callback(error);
                            throw new Error(error);
                        }
                        _p.label = 43;
                    case 43: return [2 /*return*/];
                }
            });
        });
    };
    Room.prototype.close = function () {
        logger.info("Room " + this._roomId + " closed.");
        this._closed = true;
        this._peers.forEach(function (peer) {
            if (!peer.getPeerInfo().closed) {
                peer.close();
            }
        });
        this._peers.clear();
        this._router.close();
        this.emit('close');
    };
    return Room;
}(EventEmitter));
exports.Room = Room;
