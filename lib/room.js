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
var EventEmitter = require('events').EventEmitter;
var config = require('../config/config');
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
        return _this;
    }
    Room.create = function (_a) {
        var worker = _a.worker, roomId = _a.roomId;
        return __awaiter(this, void 0, void 0, function () {
            var mediaCodecs, router;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('[Creating Room] roomId:%s', roomId);
                        mediaCodecs = config.mediasoup.routerOptions.mediaCodecs;
                        return [4 /*yield*/, worker.createRouter({ mediaCodecs: mediaCodecs })];
                    case 1:
                        router = _b.sent();
                        // const audioLevelObserver = await router.createAudioLevelObserver(
                        //     {
                        //         maxEntries : 1,
                        //         threshold  : -80,
                        //         interval   : 800
                        //     });
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
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!consumerPeer) {
                            throw new Error("peer with id \"" + consumerPeer.id + "\" does not exist");
                        }
                        if (!consumerPeer.getPeerInfo().rtpCapabilities) {
                            throw new Error('peer does not have rtpCapabilities');
                        }
                        if (!this._router.canConsume({
                            producerId: producer.id,
                            rtpCapabilities: consumerPeer.getPeerInfo().rtpCapabilities
                        })) {
                            throw new Error("Can not consume peer : " + producerPeer.id + " 's producer : " + producer.id + " : ");
                        }
                        console.log("create consumer of " + producerPeer.id + " for " + consumerPeer.id);
                        return [4 /*yield*/, consumerPeer.getConsumerTransport().consume({
                                producerId: producer.id,
                                rtpCapabilities: consumerPeer.getPeerInfo().rtpCapabilities
                            })];
                    case 1:
                        consumer = _a.sent();
                        consumerPeer.setConsumer(consumer.id, consumer);
                        consumer.on('transportclose', function () {
                            consumerPeer.deleteConsumer(consumer.id);
                        });
                        consumer.on('producerclose', function () {
                            consumerPeer.deleteConsumer(consumer.id);
                            _this._notify(consumerPeer.socket, 'consumerClosed', { consumerId: consumer.id });
                        });
                        consumer.on('producerpause', function () {
                            _this._notify(consumerPeer.socket, 'consumerPaused', { consumerId: consumer.id });
                        });
                        consumer.on('producerresume', function () {
                            _this._notify(consumerPeer.socket, 'consumerResumed', { consumerId: consumer.id });
                        });
                        this._notify(consumerPeer.socket, 'newConsumer', {
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
                        console.log("create data consumer of " + producerPeer.id + " for " + consumerPeer.id);
                        return [4 /*yield*/, producerPeer.getConsumerTransport().consumeData({
                                dataProducerId: dataProducer.id
                            })];
                    case 1:
                        dataConsumer = _a.sent();
                        consumerPeer.setDataConsumer(dataConsumer.id, dataConsumer);
                        dataConsumer.on('transportclose', function () {
                            consumerPeer.deleteDataConsumer(dataConsumer.id);
                        });
                        dataConsumer.on('dataproducerclose', function () {
                            consumerPeer.deleteDataConsumer(dataConsumer.id);
                            dataConsumer.close();
                            _this._notify(consumerPeer.socket, 'dataConsumerClosed', {
                                dataConsumerId: dataConsumer.id
                            }, true);
                        });
                        this._notify(consumerPeer.socket, 'newDataConsumer', {
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
        var peer = new peerImpl_1.PeerImpl(peerId, socket);
        socket.on('request', function (request, callback) {
            _this._handleRequest(peer, request, callback)["catch"](function (error) {
                console.log('"request failed [error:"%o"]"', error);
                callback(error, {});
            });
        });
        peer.on('close', function () {
            if (_this._closed) {
                return;
            }
            _this._notify(socket, 'peerClose', {
                peerId: peerId
            }, true);
            _this._peers["delete"](peerId);
            peer.socket.leave(_this._roomId);
            peer.socket.disconnect(true);
            if (_this._peer.length === 0) {
                _this.close();
            }
        });
    };
    Room.prototype._handleRequest = function (peer, request, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, displayName, joined, device, rtpCapabilities, sctpCapabilities, joinedPeers, peerInfos_1, _c, sctpCapabilities, transportType, webRtcTransportOptions, transport, _d, transportId, dtlsParameters, transport, _e, transportId, kind, rtpParameters, appData, transport, error, producer_1, joinedPeers, _f, transportId, sctpStreamParameters, protocol, transport, dataProducer_1, joinedPeers, producerId, producer, error, producerId, producer, error, producerId, producer, error, consumerId, consumer, error, consumerId, consumer, error;
            var _this = this;
            return __generator(this, function (_g) {
                switch (_g.label) {
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
                            case global_1.RequestMethod.close: return [3 /*break*/, 23];
                        }
                        return [3 /*break*/, 24];
                    case 1:
                        {
                            callback(null, this._router.rtpCapabilities);
                            return [3 /*break*/, 25];
                        }
                        _g.label = 2;
                    case 2:
                        {
                            _b = request.data, displayName = _b.displayName, joined = _b.joined, device = _b.device, rtpCapabilities = _b.rtpCapabilities, sctpCapabilities = _b.sctpCapabilities;
                            if (joined) {
                                callback('Client is already joined!');
                                return [3 /*break*/, 25];
                            }
                            peer.setPeerInfo({
                                displayName: displayName,
                                joined: true,
                                closed: false,
                                device: device,
                                rtpCapabilities: rtpCapabilities,
                                sctpCapabilities: sctpCapabilities
                            });
                            this._notify(peer.socket, 'newPeer', {
                                id: peer.id,
                                displayName: displayName,
                                device: device
                            }, true);
                            peer.socket.join(this._roomId);
                            this._peers.set(peer.id, peer);
                            joinedPeers = this._getJoinedPeers({ excludePeer: peer });
                            peerInfos_1 = [];
                            joinedPeers.forEach(function (joinedPeer) {
                                peerInfos_1.push({
                                    id: joinedPeer.id,
                                    displayName: joinedPeer.displayName,
                                    device: joinedPeer.device
                                });
                                joinedPeer.getAllProducer().forEach(function (producer) {
                                    _this.createConsumer(peer, joinedPeer, producer);
                                });
                                joinedPeer.getAllDataProducer().forEach(function (dataProducer) {
                                    _this.createDataConsumer(peer, joinedPeer, dataProducer);
                                });
                            });
                            callback(null, peerInfos_1);
                            return [3 /*break*/, 25];
                        }
                        _g.label = 3;
                    case 3:
                        console.log("[Create Transport] peerId:%s", peer.id);
                        _c = request.data, sctpCapabilities = _c.sctpCapabilities, transportType = _c.transportType;
                        if (transportType !== 'consumer' && transportType !== 'producer') {
                            callback('transport type ERROR!', { sendType: transportType });
                            callback('transport type ERROR!', { sendType: transportType });
                            return [3 /*break*/, 25];
                        }
                        webRtcTransportOptions = __assign(__assign({}, config.mediasoup.webRtcTransportOptions), { enableSctp: Boolean(sctpCapabilities), numSctpStreams: (sctpCapabilities || {}).numStreams, appData: {
                                transportType: transportType
                            } });
                        return [4 /*yield*/, this._router.createWebRtcTransport(webRtcTransportOptions)];
                    case 4:
                        transport = _g.sent();
                        peer.setTransport(transport.id, transport);
                        callback(null, {
                            id: transport.id,
                            iceParameters: transport.iceParameters,
                            iceCandidates: transport.iceCandidates,
                            dtlsParameters: transport.dtlsParameters,
                            sctpParameters: transport.sctpParameters
                        });
                        return [3 /*break*/, 25];
                    case 5:
                        console.log("[Connect Transport] peerId:%s", peer.id);
                        _d = request.data, transportId = _d.transportId, dtlsParameters = _d.dtlsParameters;
                        transport = peer.getTransport(transportId);
                        return [4 /*yield*/, transport.connect({ dtlsParameters: dtlsParameters })];
                    case 6:
                        _g.sent();
                        callback(null, {});
                        return [3 /*break*/, 25];
                    case 7:
                        console.log("[Produce] peerId:%s", peer.id);
                        _e = request.data, transportId = _e.transportId, kind = _e.kind, rtpParameters = _e.rtpParameters;
                        appData = request.data.appData;
                        transport = peer.getTransport(transportId);
                        if (!transport) {
                            error = "transport with id \"" + transportId + "\" not found";
                            callback(error, {});
                            return [3 /*break*/, 25];
                        }
                        appData = __assign(__assign({}, appData), { peerId: peer.id });
                        return [4 /*yield*/, transport.produce({ kind: kind, rtpParameters: rtpParameters, appData: appData })];
                    case 8:
                        producer_1 = _g.sent();
                        peer.setProducer(producer_1.id, producer_1);
                        callback(null, { producerId: producer_1.id });
                        joinedPeers = this._getJoinedPeers({ excludePeer: peer });
                        joinedPeers.forEach(function (joinedPeer) {
                            _this.createConsumer(joinedPeer, peer, producer_1);
                        });
                        return [3 /*break*/, 25];
                    case 9:
                        console.log("[Data Producer] : peerId : " + peer.id);
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
                        dataProducer_1 = _g.sent();
                        return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, transport.produceData({
                            sctpStreamParameters: sctpStreamParameters,
                            protocol: protocol
                        })];
                    case 12:
                        dataProducer_1 = _g.sent();
                        _g.label = 13;
                    case 13:
                        peer.setDataProducer(dataProducer_1.id, dataProducer_1);
                        callback(null, { id: dataProducer_1.id });
                        joinedPeers = this._getJoinedPeers({ excludePeer: peer });
                        joinedPeers.forEach(function (joinedPeer) {
                            _this.createDataConsumer(joinedPeer, peer, dataProducer_1);
                        });
                        return [3 /*break*/, 25];
                    case 14:
                        {
                            producerId = request.data.producerId;
                            producer = peer.getProducer(producerId);
                            if (!producer) {
                                error = "producer with id \"" + producerId + "\" not found";
                                console.log(error);
                                callback(error, {});
                            }
                            console.log('close producer, peer id : %s, producer id : %s', peer.id, producerId);
                            producer.close();
                            peer.deleteProducer(producer.id);
                            callback();
                            return [3 /*break*/, 25];
                        }
                        _g.label = 15;
                    case 15:
                        producerId = request.data.producerId;
                        producer = peer.getProducer(producerId);
                        if (!producer) {
                            error = "producer with id \"" + producerId + "\" not found";
                            console.log(error);
                            callback(error, {});
                        }
                        console.log('pause producer, peer id : %s, producer id : %s', peer.id, producerId);
                        return [4 /*yield*/, producer.pause()];
                    case 16:
                        _g.sent();
                        callback();
                        return [3 /*break*/, 25];
                    case 17:
                        producerId = request.data.producerId;
                        producer = peer.getProducer(producerId);
                        if (!producer) {
                            error = "producer with id \"" + producerId + "\" not found";
                            console.log(error);
                            callback(error, {});
                        }
                        console.log('resume producer, peer id : %s, producer id : %s', peer.id, producerId);
                        return [4 /*yield*/, producer.resume()];
                    case 18:
                        _g.sent();
                        callback();
                        return [3 /*break*/, 25];
                    case 19:
                        consumerId = request.data.consumerId;
                        consumer = peer.getConsumer(consumerId);
                        if (!consumer) {
                            error = "consumer with id \"" + consumerId + "\" not found";
                            console.log(error);
                            callback(error, {});
                        }
                        console.log('pause consumer, peer id : %s, consumer id : %s', peer.id, consumerId);
                        return [4 /*yield*/, consumer.pause()];
                    case 20:
                        _g.sent();
                        callback();
                        return [3 /*break*/, 25];
                    case 21:
                        consumerId = request.data.consumerId;
                        consumer = peer.getConsumer(consumerId);
                        if (!consumer) {
                            error = "consumer with id \"" + consumerId + "\" not found";
                            console.log(error);
                            callback(error, {});
                        }
                        console.log('resume consumer, peer id : %s, consumer id : %s', peer.id, consumerId);
                        return [4 /*yield*/, consumer.resume()];
                    case 22:
                        _g.sent();
                        callback();
                        return [3 /*break*/, 25];
                    case 23:
                        {
                            peer.close();
                            return [3 /*break*/, 25];
                        }
                        _g.label = 24;
                    case 24:
                        {
                            callback('Unknown Request!');
                        }
                        _g.label = 25;
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    Room.prototype._timeoutCallback = function (callback) {
        var called = false;
        var interval = setTimeout(function () {
            if (called) {
                return;
            }
            called = true;
            callback(new Error('Request timeout.'));
        }, 10000);
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (called) {
                return;
            }
            called = true;
            clearTimeout(interval);
            callback.apply(void 0, args);
        };
    };
    Room.prototype._request = function (socket, method, data) {
        var _this = this;
        if (data === void 0) { data = {}; }
        return new Promise(function (resolve, reject) {
            socket.emit('request', { method: method, data: data }, _this._timeoutCallback(function (err, response) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(response);
                }
            }));
        });
    };
    Room.prototype._notify = function (socket, method, data, broadcast) {
        if (data === void 0) { data = {}; }
        if (broadcast === void 0) { broadcast = false; }
        if (broadcast) {
            socket.broadcast.to(this._roomId).emit('notify', { method: method, data: data });
        }
        else
            socket.emit('notify', { method: method, data: data });
    };
    Room.prototype.close = function () {
        console.log("Room " + this._roomId + " closed.");
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
