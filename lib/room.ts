import {PeerImpl} from "./peerImpl";
import {Peer} from './peer';
import {RequestMethod} from "./global";
import {Socket} from "socket.io";
import {response} from "express";
import {types as MTypes} from 'mediasoup';

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
        console.log("[New Peer] peerId:%s", peerId)
        console.log("[PeerList]", this._peers.keys())
        socket.on('request', (request, callback) => {
            this._handleRequest(this._peers.get(peerId), request, callback)
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
                callback(null, this._router.rtpCapabilities);
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
                console.log("[Create Transport] peerId:%s", peer.id)
                const {sctpCapabilities, transportType} = request.data

                if (transportType !== 'consumer' && transportType !== 'producer') {
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
                await transport.connect(dtlsParameters);

                callback(null, {});
                break;
            }
            case RequestMethod.consume :
            {
                console.log("[Consume] peerId:%s", peer.id)
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
                break;
            }
            case RequestMethod.pauseProducer :
            {
                break;
            }
            case RequestMethod.resumeProducer :
            {
                break;
            }
            case RequestMethod.pauseConsumer :
            {
                break;

            }
            case RequestMethod.resumeConsumer :
            {
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
