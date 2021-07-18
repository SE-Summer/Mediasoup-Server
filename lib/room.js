
const EventEmitter = require('events').EventEmitter;

class Room extends EventEmitter{
    static async create({ worker, roomId })
    {
        //logger.info('create() [roomId:%s]', roomId);

        //const protooRoom = new protoo.Room();

        const { mediaCodecs } = config.mediasoup.routerOptions;

        const router = await worker.createRouter({ mediaCodecs });

        const audioLevelObserver = await router.createAudioLevelObserver(
            {
                maxEntries : 1,
                threshold  : -80,
                interval   : 800
            });

        //const bot = await Bot.create({ mediasoupRouter });

        return new Room(
            {
                roomId,
                //protooRoom,
                router,
                audioLevelObserver,
                //bot
            });
    }

    constructor({ roomId, /*protooRoom, */ router, audioLevelObserver /*bot*/ })
    {
        super();
        this.setMaxListeners(Infinity);

        this._roomId = roomId;

        this._closed = false;

        //this._protooRoom = protooRoom;

        this._router = router;

        this._audioLevelObserver = audioLevelObserver;

        //this._bot = bot;

        this._handleAudioLevelObserver();

        global.audioLevelObserver = this._audioLevelObserver;
    }

    _handleAudioLevelObserver()
    {
        this._audioLevelObserver.on('volumes', (volumes) =>
        {
            const { producer, volume } = volumes[0];

            // logger.debug(
            // 	'audioLevelObserver "volumes" event [producerId:%s, volume:%s]',
            // 	producer.id, volume);

            // Notify all Peers.
            // for (const peer of this._getJoinedPeers())
            // {
            //     peer.notify(
            //         'activeSpeaker',
            //         {
            //             peerId : producer.appData.peerId,
            //             volume : volume
            //         })
            //         .catch(() => {});
            // }
        });

        this._audioLevelObserver.on('silence', () =>
        {
            // logger.debug('audioLevelObserver "silence" event');

            // Notify all Peers.
            // for (const peer of this._getJoinedPeers())
            // {
            //     peer.notify('activeSpeaker', { peerId: null })
            //         .catch(() => {});
            // }
        });
    }

    // _getJoinedPeers({ excludePeer = undefined } = {})
    // {
    //     return this._protooRoom.peers
    //         .filter((peer) => peer.data.joined && peer !== excludePeer);
    // }

}