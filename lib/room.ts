import {PeerImpl} from "./peerImpl";
import {Peer} from './peer';
import {RequestMethod} from "./global";
import {Socket} from "socket.io";
import {response} from "express";
import {types as MTypes} from 'mediasoup';
import {Consumer} from "mediasoup/lib/Consumer";

const EventEmitter = require('events').EventEmitter;
const config = require('../config/config')


export class Room extends EventEmitter{
    static async create({ worker, roomId })
    {
        //logger.info('create() [roomId:%s]', roomId);

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
        return this._peers
            .filter((peer) => peer !== excludePeer);
    }

    async createTransport({peerId,sctpCapabilities}) {

        const webRtcTransportOptions =
            {
                ...config.mediasoup.webRtcTransportOptions,
                enableSctp     : Boolean(sctpCapabilities),
                numSctpStreams : (sctpCapabilities || {}).numStreams
            };

        const peer = this._peers.get(peerId)

        const transport = await this._router.createWebRtcTransport(
            webRtcTransportOptions);

        peer.setTransport(transport.id, transport)

        return {
            id             : transport.id,
            iceParameters  : transport.iceParameters,
            iceCandidates  : transport.iceCandidates,
            dtlsParameters : transport.dtlsParameters,
            sctpParameters : transport.sctpParameters
        };
    }

    async connectTransport({peerId, transportId, dtlsParameters}) {
        const peer = this._peers.get(peerId);
        if (!peer)
            throw new Error(`peer with id "${peerId}" does not exist`);

        const transport = peer.getTransport(transportId);
        if (!transport)
            throw new Error(`transport with id "${transportId}" does not exist`);

        await transport.connect({ dtlsParameters });
    }

    async createProducer({peerId, transportId, kind, rtpParameters}) {
        const peer = this._peers.get(peerId);
        if (!peer)
            throw new Error(`peer with id "${peerId}" does not exist`);

        const transport = peer.getTransport(transportId);
        if (!transport)
            throw new Error(`transport with id "${transportId}" does not exist`);

        const producer =
            await transport.produce({ kind, rtpParameters });

        // Store it.
        peer.setProducer(producer.id, producer);

        // producer.on('videoorientationchange', (videoOrientation) =>
        // {
        //     logger.debug(
        //         'broadcaster producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]',
        //         producer.id, videoOrientation);
        // });

        // Optimization: Create a server-side Consumer for each Peer.
        // for (const peer of this._getJoinedPeers())
        // {
        //     this._createConsumer(
        //         {
        //             consumerPeer : peer,
        //             producerPeer : broadcaster,
        //             producer
        //         });
        // }

        // Add into the audioLevelObserver.
        // if (producer.kind === 'audio')
        // {
        //     this._audioLevelObserver.addProducer({ producerId: producer.id })
        //         .catch(() => {});
        // }
        return { id: producer.id };
    }

    async createConsumer(consumerPeer : PeerImpl, producerPeer : PeerImpl, producer : MTypes.Producer) {
        if (!consumerPeer)
            throw new Error(`peer with id "${consumerPeer.id}" does not exist`);

        if (!consumerPeer.getPeerInfo().rtpCapabilities)
            throw new Error('peer does not have rtpCapabilities');

        const consumer = await consumerPeer.getConsumerTransport().consume(
            {
                producerId : producer.id,
                rtpCapabilities : consumerPeer.getPeerInfo().rtpCapabilities
            });

        // Store it.
        consumerPeer.setConsumer(consumer.id, consumer);

        // Set Consumer events.
        // consumer.on('transport close', () =>
        // {
        //     // Remove from its map.
        //     peer.deleteConsumer(consumer.id);
        // });
        //
        // consumer.on('producer close', () =>
        // {
        //     // Remove from its map.
        //     peer.deleteConsumer(consumer.id);
        // });

        this._notify(consumerPeer.socket, 'newProducer', {
            producerPeerId : producerPeer.id,
            kind : producer.kind,
            producerId : producer.id,
            consumerId : consumer.id,
            rtpParameters : consumer.rtpParameters,
            type : consumer.type,
        })

        return {
            id            : consumer.id,
            producerId : producer.id,
            kind          : consumer.kind,
            rtpParameters : consumer.rtpParameters,
            type          : consumer.type
        };
    }

    handleConnection(peerId, socket){
        this._peers.set(peerId, new PeerImpl(peerId, socket))
        socket.on('request', (request, callback) => {
            this._handleRequest(this.peers.get(peerId), request, callback)
                .catch((error) => {
                    console.log('"request failed [error:"%o"]"', error);

                    callback(error, {});
                })
        })
    }

    private async _handleRequest(peer : PeerImpl, request, callback) {
        switch (request.method) {
            case RequestMethod.getRouterRtpCapabilities :
            {
                callback(null, {
                    rtpCapabilities : this._router.rtpCapabilities
                });
                break;
            }
            case RequestMethod.join :
            {
                const {displayName, joined, device, rtpCapabilites} = request.data;

                if (joined) {
                    callback(null, {joined : true});
                    break;
                }

                peer.setPeerInfo({
                    displayName : displayName,
                    joined : true,
                    device : device,
                    rtpCapabilities : rtpCapabilites
                });

                const joinedPeers = this._getJoinedPeers({excludePeer : peer});

                const peerInfos = joinedPeers.map((joinedPeer) => ({
                    id : joinedPeer.id,
                    displayName : joinedPeer.displayName,
                    device : joinedPeer.device
                }));

                callback(null, {peerInfos});

                break;
            }
            case RequestMethod.createTransport :
            {
                const {transportType} = request.data

                if (transportType !== 'consumer' && transportType !== 'producer') {
                    callback('transport type ERROR!', {sendType : transportType});
                    break;
                }

                const webRtcTransportOptions =
                    {
                        ...config.mediasoup.webRtcTransportOptions,
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
                const {transportId, dtlsParameters} = request.data;

                const transport = peer.getTransport(transportId);
                await transport.connect(dtlsParameters);

                callback(null, {});
                break;
            }
            case RequestMethod.consumer :
            {
                const {subscribeId} = request.data;

                const subscribedInfo = [];
                subscribeId.forEach((id) => {
                    const subscribedPeer = this._peers.get(id);
                    subscribedPeer.getAllProducer().forEach((producer) => {
                        subscribedInfo.push(this.createConsumer(peer, subscribedPeer, producer));
                    })
                })
                callback(null, {subscribedInfo});
                break;
            }
            case RequestMethod.produce :
            {
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
            default :
            {

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

    _notify(socket : Socket, method : string, data = {}) {
        socket.emit('notify', { method, data });
    }
}
