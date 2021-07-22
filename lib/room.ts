import {PeerImpl} from "./peerImpl";
import {Peer} from './peer';
import {RequestMethod} from "./global";
import {Socket} from "socket.io";
import {types as MTypes} from 'mediasoup';
import {Consumer} from "mediasoup/lib/Consumer";

const EventEmitter = require('events').EventEmitter;
const config = require('../config/config')


export class Room extends EventEmitter{
    static async create({ worker, roomId })
    {
        console.log('[Creating Room] roomId:%s', roomId);

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
    //
    // async createTransport({peerId,sctpCapabilities}) {
    //
    //     const webRtcTransportOptions =
    //         {
    //             ...config.mediasoup.webRtcTransportOptions,
    //             enableSctp     : Boolean(sctpCapabilities),
    //             numSctpStreams : (sctpCapabilities || {}).numStreams
    //         };
    //
    //     const peer = this._peers.get(peerId)
    //
    //     const transport = await this._router.createWebRtcTransport(
    //         webRtcTransportOptions);
    //
    //     peer.setTransport(transport.id, transport)
    //
    //     return {
    //         id             : transport.id,
    //         iceParameters  : transport.iceParameters,
    //         iceCandidates  : transport.iceCandidates,
    //         dtlsParameters : transport.dtlsParameters,
    //         sctpParameters : transport.sctpParameters
    //     };
    // }
    //
    // async connectTransport({peerId, transportId, dtlsParameters}) {
    //     const peer = this._peers.get(peerId);
    //     if (!peer)
    //         throw new Error(`peer with id "${peerId}" does not exist`);
    //
    //     const transport = peer.getTransport(transportId);
    //     if (!transport)
    //         throw new Error(`transport with id "${transportId}" does not exist`);
    //
    //     await transport.connect({ dtlsParameters });
    // }
    //
    // async createProducer({peerId, transportId, kind, rtpParameters}) {
    //     const peer = this._peers.get(peerId);
    //     if (!peer)
    //         throw new Error(`peer with id "${peerId}" does not exist`);
    //
    //     const transport = peer.getTransport(transportId);
    //     if (!transport)
    //         throw new Error(`transport with id "${transportId}" does not exist`);
    //
    //     const producer =
    //         await transport.produce({ kind, rtpParameters });
    //
    //     // Store it.
    //     peer.setProducer(producer.id, producer);
    //
    //     // producer.on('videoorientationchange', (videoOrientation) =>
    //     // {
    //     //     logger.debug(
    //     //         'broadcaster producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]',
    //     //         producer.id, videoOrientation);
    //     // });
    //
    //     // Optimization: Create a server-side Consumer for each Peer.
    //     // for (const peer of this._getJoinedPeers())
    //     // {
    //     //     this._createConsumer(
    //     //         {
    //     //             consumerPeer : peer,
    //     //             producerPeer : broadcaster,
    //     //             producer
    //     //         });
    //     // }
    //
    //     // Add into the audioLevelObserver.
    //     // if (producer.kind === 'audio')
    //     // {
    //     //     this._audioLevelObserver.addProducer({ producerId: producer.id })
    //     //         .catch(() => {});
    //     // }
    //     return { id: producer.id };
    // }

    async createConsumer(consumerPeer : PeerImpl, producerPeer : PeerImpl, producer : MTypes.Producer) {
        if (!consumerPeer) {
            throw new Error(`peer with id "${consumerPeer.id}" does not exist`);
        }

        if (!consumerPeer.getPeerInfo().rtpCapabilities) {
            throw new Error('peer does not have rtpCapabilities');
        }

        if (!this._router.canConsume({
            producerId : producer.id,
            rtpCapabilities : consumerPeer.getPeerInfo().rtpCapabilities
        })) {
            throw new Error(`Can not consume peer : ${producerPeer.id} 's producer : ${producer.id} : `);
        }

        console.log(`create consumer of ${producerPeer.id} for ${consumerPeer.id}`);

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

        return {
            consumerId            : consumer.id,
            producerId : producer.id,
            kind          : consumer.kind,
            rtpParameters : consumer.rtpParameters,
            type          : consumer.type
        };
    }

    handleConnection(peerId, socket){
        let peer = new PeerImpl(peerId, socket);

        socket.on('request', (request, callback) => {
            this._handleRequest(peer, request, callback)
                .catch((error) => {
                    console.log('"request failed [error:"%o"]"', error);

                    callback(error, {});
                })
        })

        peer.on('close', () => {
            if (this._closed) {
                return;
            }
            this._notify(socket, 'peerClose', {
                peerId : peerId
            },true);
            this._peers.delete(peerId);
            peer.socket.leave(this._roomId);

            if (this._peer.length === 0) {
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
                const {displayName, joined, device, rtpCapabilities} = request.data;

                if (joined) {
                    callback('Client is already joined!',);
                    break;
                }

                peer.setPeerInfo({
                    displayName : displayName,
                    joined : true,
                    closed : false,
                    device : device,
                    rtpCapabilities : rtpCapabilities
                });

                console.log('[peers]',this._peers.keys());

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

                const peerInfos = [];
                joinedPeers.forEach((joinedPeer) => (peerInfos.push({
                    id : joinedPeer.id,
                    displayName : joinedPeer.displayName,
                    device : joinedPeer.device
                })));

                callback(null, peerInfos);

                break;
            }
            case RequestMethod.createTransport :
            {
                const {sctpCapabilities, transportType} = request.data
                console.log("[Create Transport] peerId:%s, type:%s", peer.id, transportType)

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
                console.log("[Connect Transport] peerId:%s", peer.id)
                const {transportId, dtlsParameters} = request.data;

                const transport = peer.getTransport(transportId);
                await transport.connect({dtlsParameters});

                callback(null, {});
                break;
            }
            case RequestMethod.consume :
            {
                console.log("[Consume] peerId:%s", peer.id)
                const {subscribeIds} = request.data;
                const subscribedInfo = [];
                for (const id of subscribeIds) {
                    const subscribedPeer = this._peers.get(id);
                    for (const producer of subscribedPeer.getAllProducer()) {
                        subscribedInfo.push(await this.createConsumer(peer, subscribedPeer, producer));
                    }
                }
                console.log(subscribedInfo)
                callback(null, subscribedInfo);
                break;
            }
            case RequestMethod.produce :
            {
                console.log("[Produce] peerId:%s", peer.id)
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
            case RequestMethod.closeProducer :
            {
                const {producerId} = request.data;
                const producer = peer.getProducer(producerId);

                if (!producer) {
                    let error = `producer with id "${producerId}" not found`;
                    console.log(error);
                    callback(error, {});
                }

                console.log('close producer, peer id : %s, producer id : %s', peer.id, producerId);

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
                    console.log(error);
                    callback(error, {});
                }

                console.log('pause producer, peer id : %s, producer id : %s', peer.id, producerId);

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
                    console.log(error);
                    callback(error, {});
                }

                console.log('resume producer, peer id : %s, producer id : %s', peer.id, producerId);

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
                    console.log(error);
                    callback(error, {});
                }

                console.log('pause consumer, peer id : %s, consumer id : %s', peer.id, consumerId);

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
                    console.log(error);
                    callback(error, {});
                }

                console.log('resume consumer, peer id : %s, consumer id : %s', peer.id, consumerId);

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
                callback('Unknown Request!',);
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
        console.log(`Room ${this._roomId} closed.`);
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
