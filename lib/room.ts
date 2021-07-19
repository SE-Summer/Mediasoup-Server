import {PeerImpl} from "./peerImpl";

const EventEmitter = require('events').EventEmitter;
import {Peer} from './peer';
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

    async createConsumer({peerId, transportId, producerId}) {
        const peer = this._peers.get(peerId);
        if (!peer)
            throw new Error(`peer with id "${peerId}" does not exist`);

        if (!peer.getCapabilities())
            throw new Error('peer does not have rtpCapabilities');

        const transport = peer.getTransport(transportId);
        if (!transport)
            throw new Error(`transport with id "${transportId}" does not exist`);

        const consumer = await transport.consume(
            {
                producerId,
                rtpCapabilities : peer.getCapabilities()
            });

        // Store it.
        peer.setConsumer(consumer.id, consumer);

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

        return {
            id            : consumer.id,
            producerId,
            kind          : consumer.kind,
            rtpParameters : consumer.rtpParameters,
            type          : consumer.type
        };
    }

    handleConnection(peerId, socket){
        //socket.on('request', )

        this._peers.set(peerId, new PeerImpl(peerId, socket))
    }
}
