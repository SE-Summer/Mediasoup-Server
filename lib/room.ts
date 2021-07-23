import {PeerImpl} from "./peerImpl";
import {Peer} from './peer';
import {RequestMethod} from "./global";
import {Socket} from "socket.io";
import {types as MTypes} from 'mediasoup';

const EventEmitter = require('events').EventEmitter;
const config = require('../config/config');
const {logger} = require('./global');


export class Room extends EventEmitter{
    static async create({ worker, roomId })
    {
        logger.info(`Create Room ${roomId}`);

        const { mediaCodecs } = config.mediasoup.routerOptions;

        const router = await worker.createRouter({ mediaCodecs });

        // const audioLevelObserver = await router.createAudioLevelObserver(
        //     {
        //         maxEntries : 1,
        //         threshold  : -80,
        //         interval   : 800
        //     });

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
           consumerPeer.deleteConsumer(consumer.id);
        });

        consumer.on('producerclose', () => {
            consumerPeer.deleteConsumer(consumer.id);
            this._notify(consumerPeer.socket, 'consumerClosed', {consumerId : consumer.id});
        });

        consumer.on('producerpause', () => {
            this._notify(consumerPeer.socket, 'consumerPaused', {consumerId : consumer.id});
        })

        consumer.on('producerresume', () => {
            this._notify(consumerPeer.socket, 'consumerResumed', {consumerId : consumer.id});
        })

        this._notify(consumerPeer.socket, 'newConsumer', {
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
            consumerPeer.deleteDataConsumer(dataConsumer.id);
        })

        dataConsumer.on('dataproducerclose', () => {
            consumerPeer.deleteDataConsumer(dataConsumer.id);
            dataConsumer.close();

            this._notify(consumerPeer.socket, 'dataConsumerClosed', {
                dataConsumerId : dataConsumer.id
            },true);
        })

        this._notify(consumerPeer.socket, 'newDataConsumer', {
            producerPeerId : producerPeer.id,
            dataProducerId : dataProducer.id,
            dataConsumerId : dataConsumer.id,
            sctpParameters : dataConsumer.sctpStreamParameters,
            protocol : dataConsumer.protocol,
            label : dataConsumer.label
        });
    }

    handleConnection(peerId, socket){
        let peer = new PeerImpl(peerId, socket);

        this._peers.set(peerId, peer);

        socket.on('request', (request, callback) => {
            this._handleRequest(peer, request, callback)
                .catch((error) => {
                    logger.warn(`request failed [${error}]`);

                    callback(error, {});
                })
        })

        peer.on('close', () => {
            if (this._closed) {
                return;
            }
            this._notify(socket, 'peerClosed', {
                peerId : peerId
            },true);
            logger.info(`Peer ${peerId} closed`);

            this._peers.delete(peerId);
            peer.socket.leave(this._roomId);
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
                const {displayName, joined, device, rtpCapabilities, sctpCapabilities} = request.data;

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

                logger.info(`peer ${peer.id} joined!`);

                peer.setPeerInfo({
                    displayName : displayName,
                    joined : true,
                    closed : false,
                    device : device,
                    rtpCapabilities : rtpCapabilities,
                    sctpCapabilities : sctpCapabilities
                });

                this._notify(peer.socket, 'newPeer', {
                    id : peer.id,
                    displayName : displayName,
                    device : device
                }, true);

                peer.socket.join(this._roomId);
                this._peers.set(peer.id, peer);

                const joinedPeers = this._getJoinedPeers({excludePeer : peer});
                const peerInfos = [];

                joinedPeers.forEach((joinedPeer) => {
                    peerInfos.push({
                        id : joinedPeer.id,
                        displayName : joinedPeer.displayName,
                        device : joinedPeer.device
                    });

                    joinedPeer.getAllProducer().forEach((producer) => {
                        this.createConsumer(peer, joinedPeer, producer);
                    });

                    joinedPeer.getAllDataProducer().forEach((dataProducer) => {
                        this.createDataConsumer(peer, joinedPeer, dataProducer);
                    })
                })

                callback(null, peerInfos);

                break;
            }
            case RequestMethod.createTransport :
            {
                logger.info(`Create Transport ${peer.id}`);
                const {sctpCapabilities, transportType} = request.data

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
                logger.info(`Connect Transport ${peer.id}`);
                const {transportId, dtlsParameters} = request.data;

                const transport = peer.getTransport(transportId);
                await transport.connect({dtlsParameters});

                callback(null, {});
                break;
            }
            case RequestMethod.produce :
            {
                logger.info(`Produce ${peer.id}`);
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
                logger.info(`Produce Data ${peer.id}`);

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

                logger.info(`close producer, peer id : ${peer.id}, producer id : ${producerId}`);

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

                logger.info(`pause producer, peer id : ${peer.id}, producer id : ${producerId}`);

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

                logger.info(`resume producer, peer id : ${peer.id}, producer id : ${producerId}`);

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

                logger.info(`pause consumer, peer id : ${peer.id}, consumer id : ${consumerId}`);

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

                logger.info(`resume consumer, peer id : ${peer.id}, consumer id : ${consumerId}`);

                await consumer.resume();

                callback();
                break;
            }
            case RequestMethod.close :
            {
                peer.close();
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

    _timeoutCallback(callback) {
        let called = false;

        const interval = setTimeout(() => {
                if (called) {
                    return;
                }

                called = true;
                callback(new Error('Request timeout.'));
            },
            10000
        );

        return (...args) => {
            if (called) {
                return;
            }

            called = true;
            clearTimeout(interval);

            callback(...args);
        };
    }

    _request(socket : Socket, method : string, data = {}) {
        return new Promise((resolve, reject) => {
            socket.emit(
                'request',
                {method, data},
                this._timeoutCallback((err, response) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(response);
                    }
                })
            )
        })
    }

    _notify(socket : Socket, method : string, data = {}, broadcast = false) {
        if (broadcast) {
            socket.broadcast.to(this._roomId).emit(
                'notify', {method, data}
            );
        } else
            socket.emit('notify', {method, data});
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
