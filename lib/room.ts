import {PeerImpl} from "./peerImpl";
import {Peer} from './peer';
import {RequestMethod} from "./global";
import {Socket} from "socket.io";
import {types as MTypes} from 'mediasoup';
import {DB} from '../mysql/mysql'
import {_notify} from "./global";

const EventEmitter = require('events').EventEmitter;
const config = require('../config/config');
const {logger} = require('./global');
const mysqlDB = new DB();

export class Room extends EventEmitter{
    static async create({ worker, roomId })
    {
        logger.info(`Create Room ${roomId}`);

        const { mediaCodecs } = config.mediasoup.routerOptions;

        const router = await worker.createRouter({ mediaCodecs });

        return new Room(
            {
                roomId,
                router
            });
    }

    constructor({ roomId, router})
    {
        super();
        this.setMaxListeners(Infinity);

        this._roomId = roomId;

        this._closed = false;

        this._router = router;

        this._peers = new Map<String, Peer>();

        this._host = null;
    }

    _getJoinedPeers({ excludePeer = undefined } = {})
    {
        if (excludePeer === undefined) {
            return this._peers;
        }

        let filteredPeers = new Map(this._peers);
        filteredPeers.delete(excludePeer.id);
        return filteredPeers;
    }

    async createConsumer(consumerPeer : PeerImpl, producerPeer : PeerImpl, producer : MTypes.Producer) {
        if (!consumerPeer) {
            throw new Error(`peer with id "${consumerPeer.id}" does not exist`);
        }

        if (!consumerPeer.getPeerInfo().rtpCapabilities) {
            throw new Error(`peer ${consumerPeer.id} does not have rtpCapabilities`);
        }

        if (!this._router.canConsume({
            producerId : producer.id,
            rtpCapabilities : consumerPeer.getPeerInfo().rtpCapabilities
        })) {
            throw new Error(`Can not consume peer : ${producerPeer.id} 's producer : ${producer.id} : `);
        }

        logger.info(`create consumer of ${producerPeer.id} for ${consumerPeer.id}`);

        const consumer = await consumerPeer.getConsumerTransport().consume(
            {
                producerId : producer.id,
                rtpCapabilities : consumerPeer.getPeerInfo().rtpCapabilities
            });

        consumerPeer.setConsumer(consumer.id, consumer);

        consumer.on('transportclose', () => {
            logger.info(`Consumer of peer ${consumerPeer.id} Closed because of transport closed`);
            consumerPeer.deleteConsumer(consumer.id);
        });

        consumer.on('producerclose', () => {
            logger.info(`Consumer of peer ${consumerPeer.id} Closed because of producer of peer ${producerPeer.id} closed`);
            consumerPeer.deleteConsumer(consumer.id);
            _notify(consumerPeer.socket, 'consumerClosed', {consumerId : consumer.id});
        });

        consumer.on('producerpause', () => {
            logger.info(`Consumer of peer ${consumerPeer.id} Paused because of producer of peer ${producerPeer.id} paused!`);
            _notify(consumerPeer.socket, 'consumerPaused', {consumerId : consumer.id});
        })

        consumer.on('producerresume', () => {
            logger.info(`Consumer of peer ${consumerPeer.id} Resumed because of producer of peer ${producerPeer.id} resumed!`);
            _notify(consumerPeer.socket, 'consumerResumed', {consumerId : consumer.id});
        })

        _notify(consumerPeer.socket, 'newConsumer', {
            producerPeerId : producerPeer.id,
            kind : producer.kind,
            producerId : producer.id,
            consumerId : consumer.id,
            rtpParameters : consumer.rtpParameters,
            type : consumer.type,
        })
    }

    async createDataConsumer (consumerPeer : PeerImpl, producerPeer : PeerImpl, dataProducer : MTypes.DataProducer) {
        if (!consumerPeer) {
            throw new Error(`peer with id "${consumerPeer.id}" does not exist`);
        }

        logger.info(`create data consumer of ${producerPeer.id} for ${consumerPeer.id}`);

        const dataConsumer = await producerPeer.getConsumerTransport().consumeData({
            dataProducerId : dataProducer.id
        });

        consumerPeer.setDataConsumer(dataConsumer.id, dataConsumer);

        dataConsumer.on("transportclose", () => {
            logger.info(`Data Consumer of peer ${consumerPeer.id} Closed because of transport closed!`);
            consumerPeer.deleteDataConsumer(dataConsumer.id);
        })

        dataConsumer.on('dataproducerclose', () => {
            logger.info(`Data Consumer of peer ${consumerPeer.id} Closed because of producer of peer ${producerPeer.id} closed!`);
            consumerPeer.deleteDataConsumer(dataConsumer.id);
            dataConsumer.close();

            _notify(consumerPeer.socket, 'dataConsumerClosed', {
                dataConsumerId : dataConsumer.id
            },true, this._roomId);
        })

        _notify(consumerPeer.socket, 'newDataConsumer', {
            producerPeerId : producerPeer.id,
            dataProducerId : dataProducer.id,
            dataConsumerId : dataConsumer.id,
            sctpParameters : dataConsumer.sctpStreamParameters,
            protocol : dataConsumer.protocol,
            label : dataConsumer.label
        });
    }

    handleConnection(peerId, socket){
        let peer;

        if (this._peers.has(peerId)) {
            peer = this._peers.get(peerId);
            logger.info(`peer ${peerId} reconnect`);
            peer.socket = socket;
        } else {
            peer = new PeerImpl(peerId, socket);
            this._peers.set(peerId, peer);
        }

        socket.on('request', (request, callback) => {
            this._handleRequest(peer, request, callback)
                .catch((error) => {
                    logger.warn(`request failed [${error}]`);

                    callback(error, {});
                })
        })

        socket.on('disconnect', () => {
            logger.info(`Peer ${peer.id} disconnected!`);
        })

        peer.on('close', () => {
            _notify(socket, 'peerClosed', {
                peerId : peerId
            },true, this._roomId);

            this._peers.delete(peerId);
            peer.socket.leave(this._roomId);

            logger.info(`Peer ${peerId} closed`);

            peer.socket.disconnect(true);

            if (this._peers.size === 0) {
                this.close();
            }
        })

    }

    private async _handleRequest(peer : PeerImpl, request, callback) {
        switch (request.method) {
            case RequestMethod.getRouterRtpCapabilities :
            {
                callback(null, this._router.rtpCapabilities);
                break;
            }
            case RequestMethod.join :
            {
                const {displayName, avatar,joined, device, rtpCapabilities, sctpCapabilities} = request.data;

                if (!rtpCapabilities) {
                    let error = `peer ${peer.id} does not have rtpCapabilities!`;
                    callback(error);
                    throw Error (error);
                }

                if (!rtpCapabilities) {
                    let error = `peer ${peer.id} does not have rtpCapabilities!`;
                    callback(error)
                    throw Error (error);
                }

                if (joined) {
                    let error = `peer ${peer.id} is already joined`;
                    callback(error);
                    throw Error (error);
                }

                let host = false;

                mysqlDB.isHost(peer.id, this._roomId, async (error, res) => {
                    if (error) {
                        callback(error);
                        throw Error (error);
                    }
                    else {
                        host = res;

                        if (host) {
                            logger.info(`Join : [Host] ${peer.id}`);
                            this._host = peer;
                        } else {
                            logger.info(`Join : [Member] ${peer.id}!`);
                        }

                        peer.setPeerInfo({
                            displayName : displayName,
                            avatar : avatar,
                            joined : true,
                            closed : false,
                            device : device,
                            rtpCapabilities : rtpCapabilities,
                            sctpCapabilities : sctpCapabilities
                        });

                        _notify(peer.socket, 'newPeer', {
                            id : peer.id,
                            displayName : displayName,
                            avatar : avatar,
                            device : device
                        }, true, this._roomId);

                        peer.socket.join(this._roomId);
                        this._peers.set(peer.id, peer);

                        const joinedPeers = this._getJoinedPeers({excludePeer : peer});
                        const peerInfos = [];

                        joinedPeers.forEach((joinedPeer) => {
                            peerInfos.push({
                                id : joinedPeer.id,
                                displayName : joinedPeer.displayName,
                                avatar : joinedPeer.avatar,
                                device : joinedPeer.device
                            });

                            joinedPeer.getAllProducer().forEach((producer) => {
                                this.createConsumer(peer, joinedPeer, producer);
                            });

                            joinedPeer.getAllDataProducer().forEach((dataProducer) => {
                                this.createDataConsumer(peer, joinedPeer, dataProducer);
                            })
                        })

                        callback(null, {
                            host : this._host.id,
                            peerInfos
                        });
                    }
                })
                break;
            }
            case RequestMethod.createTransport :
            {
                const {sctpCapabilities, transportType} = request.data;
                logger.info(`Create ${transportType} Transport : peer ${peer.id}`);

                if (transportType !== 'consumer' && transportType !== 'producer') {
                    callback('transport type ERROR!', {sendType : transportType});
                    callback('transport type ERROR!', {sendType : transportType});
                    break;
                }

                const webRtcTransportOptions =
                    {
                        ...config.mediasoup.webRtcTransportOptions,
                        enableSctp     : Boolean(sctpCapabilities),
                        numSctpStreams : (sctpCapabilities || {}).numStreams,
                        appData : {
                            transportType : transportType
                        }
                    };

                const transport = await this._router.createWebRtcTransport(webRtcTransportOptions);

                peer.setTransport(transport.id, transport);

                transport.on('routerclose', () => {
                    peer.deleteTransport(transport.id);
                    logger.info(`transport ${transport.id} closed because of router closed!`);
                })

                callback(null,
                    {
                        id             : transport.id,
                        iceParameters  : transport.iceParameters,
                        iceCandidates  : transport.iceCandidates,
                        dtlsParameters : transport.dtlsParameters,
                        sctpParameters : transport.sctpParameters
                    });
                break;
            }
            case RequestMethod.connectWebRtcTransport :
            {
                const {transportId, dtlsParameters} = request.data;

                const transport = peer.getTransport(transportId);

                logger.info(`Connect ${transport.appData.transportType} Transport : peer ${peer.id}`);

                await transport.connect({dtlsParameters});

                callback(null, {});
                break;
            }
            case RequestMethod.produce :
            {
                logger.info(`Produce : peer ${peer.id}`);
                const {transportId, kind, rtpParameters} = request.data;
                let {appData} = request.data;
                const transport = peer.getTransport(transportId);

                if(!transport){
                    let error = `transport with id "${transportId}" not found`;
                    callback(error, {});
                    break;
                }

                appData = {...appData, peerId : peer.id};
                const producer = await transport.produce(
                    {kind,rtpParameters,appData});
                peer.setProducer(producer.id, producer);
                callback(null, {producerId : producer.id});

                const joinedPeers = this._getJoinedPeers({excludePeer : peer});
                joinedPeers.forEach((joinedPeer) => {
                    this.createConsumer(joinedPeer, peer, producer);
                })
                break;
            }
            case RequestMethod.produceData :
            {
                logger.info(`Produce Data : peer ${peer.id}`);

                const {transportId, sctpStreamParameters, protocol} = request.data;

                const transport = peer.getTransport(transportId);

                if (!transport) {
                    throw new Error(`Transport with id ${transportId} does not exist!`);
                }
                let dataProducer;

                if (sctpStreamParameters === undefined) {
                    dataProducer = await transport.produceData({
                        protocol
                    })
                } else {
                    dataProducer = await transport.produceData({
                        sctpStreamParameters,
                        protocol,
                    })
                }

                peer.setDataProducer(dataProducer.id, dataProducer);

                callback(null, {id : dataProducer.id});

                const joinedPeers = this._getJoinedPeers({excludePeer : peer});

                joinedPeers.forEach((joinedPeer) => {
                    this.createDataConsumer(joinedPeer, peer, dataProducer);
                })

                break;
            }
            case RequestMethod.closeProducer :
            {
                const {producerId} = request.data;
                const producer = peer.getProducer(producerId);

                if (!producer) {
                    let error = `producer with id "${producerId}" not found`;
                    callback(error, {});
                    throw new Error(error);
                }

                logger.info(`Close producer : peer ${peer.id}, producer ${producerId}`);

                producer.close();
                peer.deleteProducer(producer.id);
                callback();
                break;
            }
            case RequestMethod.pauseProducer :
            {
                const {producerId} = request.data;
                const producer = peer.getProducer(producerId);

                if (!producer) {
                    let error = `producer with id "${producerId}" not found`;
                    callback(error, {});
                    throw new Error(error);
                }

                logger.info(`Pause producer : peer ${peer.id}, producer ${producerId}`);

                await producer.pause();
                callback();
                break;
            }
            case RequestMethod.resumeProducer :
            {
                const {producerId} = request.data;
                const producer = peer.getProducer(producerId);

                if (!producer) {
                    let error = `producer with id "${producerId}" not found`;
                    callback(error, {});
                    throw new Error(error);
                }

                logger.info(`Resume producer : peer ${peer.id}, producer ${producerId}`);

                await producer.resume();
                callback();
                break;
            }
            case RequestMethod.pauseConsumer :
            {
                const { consumerId } = request.data;
                const consumer = peer.getConsumer(consumerId);

                if (!consumer){
                    let error = `consumer with id "${consumerId}" not found`;
                    callback(error, {});
                    throw new Error(error);
                }

                logger.info(`Pause consumer : peer ${peer.id}, consumer ${consumerId}`);

                await consumer.pause();

                callback();
                break;
            }
            case RequestMethod.resumeConsumer :
            {
                const { consumerId } = request.data;
                const consumer = peer.getConsumer(consumerId);

                if (!consumer){
                    let error = `consumer with id "${consumerId}" not found`;
                    callback(error, {});
                    throw new Error(error);
                }

                logger.info(`Resume consumer : peer ${peer.id}, consumer ${consumerId}`);

                await consumer.resume();

                callback();
                break;
            }
            case RequestMethod.sendMessage :
            {
                const {toPeerId, timestamp, text} = request.data;

                const recvPeer = this._peers.get(toPeerId);

                if (!recvPeer) {
                    let error = `receive peer ${toPeerId} does NOT exist!`;
                    callback(error);
                    throw Error (error);
                }

                let message = {
                    fromPeerId : peer.id,
                    broadcast : true,
                    timestamp : timestamp,
                    text : text
                }

                if (toPeerId === undefined) {
                    logger.info(`SendMessage : peer ${peer.id} broadcast message`);
                    _notify(peer.socket, 'newMessage', message, true, this._roomId);
                } else {
                    logger.info(`SendMessage : peer ${peer.id} send message to ${toPeerId}`);
                    message.broadcast = false;
                    _notify(recvPeer.socket, 'newMessage', message);
                }
                break;
            }
            case RequestMethod.close :
            {
                if (this._host === peer && this._peers.size !== 1) {
                    let newHost;
                    for (const _peer of this._peers) {
                        if (_peer !== peer) {
                            newHost = _peer;
                            break;
                        }
                    }
                    logger.info(`Host ${peer.id} Exit, host transfer to ${newHost.id}`);
                    mysqlDB.setHost(newHost.id, this._roomId, (error, res) => {
                        if (res) {
                            this._host = newHost;
                            _notify(peer.socket, 'hostChanged', {newHostId : newHost.id}, true, this._roomId);
                            callback();
                            peer.setPeerInfo({
                                displayName : undefined,
                                avatar : undefined,
                                joined : false,
                                closed : true,
                                device : undefined,
                                rtpCapabilities : undefined,
                                sctpCapabilities : undefined
                            });
                            peer.close();
                        } else {
                            callback(error);
                            throw Error (error);
                        }
                    });
                    return;
                }

                logger.info(`Member Exit : ${peer.id}!`);
                callback();
                peer.setPeerInfo({
                    displayName : undefined,
                    avatar : undefined,
                    joined : false,
                    closed : true,
                    device : undefined,
                    rtpCapabilities : undefined,
                    sctpCapabilities : undefined
                });
                peer.close();
                break;
            }
            case RequestMethod.kick :
            {
                const {kickedPeerId} = request.data;

                if (peer !== this._host) {
                    let error = `Peer ${peer.id} is not the HOST!`;
                    callback(error);
                    throw Error (error);
                }

                logger.info(`Kick : ${kickedPeerId}`);

                let kickedPeer = this._peers.get(kickedPeerId);

                kickedPeer.close();
                callback();
                break;
            }
            case RequestMethod.mute :
            {
                const {mutedPeerId} = request.data;

                if (peer !== this._host) {
                    let error = `Peer ${peer.id} is not the HOST!`;
                    callback(error);
                    throw Error (error);
                }

                if (mutedPeerId === `all`) {
                    logger.info(`Mute : mute all members except host`);

                    for (const peer of this._peers) {
                        if (peer !== this._host) {
                            for (const audio of peer.getAllAudioProducer()) {
                                _notify(peer.socket, 'beMuted');
                                await audio.pause();
                            }
                        }
                    }
                    callback();
                    break;
                }

                const mutedPeer = this._peers.get(mutedPeerId);

                if (!mutedPeer) {
                    let error = `peer ${mutedPeerId} does NOT exist!`;
                    callback(error);
                    throw Error (error);
                }

                logger.info(`Mute : peer ${peer.id} is muted.`);

                for (const audio of mutedPeer.getAllAudioProducer()) {
                    _notify(peer.socket, 'muted');
                    await audio.pause();
                }

                callback();

                break;
            }
            case RequestMethod.transferHost :
            {
                const {hostId} = request.data;

                if (peer !== this._host) {
                    let error = `peer ${peer.id} is not the HOST`;
                    callback(error);
                    throw Error (error);
                }

                let newHost = this._peers.get(hostId);

                if (!newHost) {
                    let error = `peer ${hostId} is NOT exist`;
                    callback(error);
                    throw Error (error);
                }

                mysqlDB.setHost(hostId, this._roomId, (error, res) => {
                   if (res) {
                       logger.info(`TransferHost : transfer host from ${peer.id} to ${hostId}`);
                       this._host = newHost;
                       _notify(newHost.socket, 'hostChanged', {newHostId : hostId}, true, this._roomId);
                       callback();
                   } else {
                       callback(error);
                       throw Error (error);
                   }
                });

                break;
            }
            case RequestMethod.restartIce :
            {
                const {transportId} = request.data;

                const transport = peer.getTransport(transportId);

                if (!transport) {
                    let error = `peer ${peer.id} restart transport failed`
                    callback(error);
                    throw Error (error);
                }

                logger.info(`Restart Ice : peer ${peer.id} restart ${transport.appData.transportType}`);

                const iceParameters = await transport.restartIce();
                callback(null,{
                    iceParameters : iceParameters,
                });
                break;
            }
            default :
            {
                let error = `Unknown Request ${request.method}`;
                callback(error);
                throw new Error(error);
            }
        }
    }

    close () {
        logger.info(`Room ${this._roomId} closed.`);
        this._closed = true;

        this._peers.forEach((peer) => {
            if (!peer.getPeerInfo().closed) {
                peer.close();
            }
        })

        this._peers.clear();
        this._router.close();
        this.emit('close');
    }
}
