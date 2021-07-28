export enum RequestMethod {

    /**
     * @ev request
     * @body none
     * @response rtpCapabilites
     */
    getRouterRtpCapabilities =  'getRouterRtpCapabilities' ,

    /**
     * @ev request
     * @body {
     *     displayName,
     *     joined,
     *     device,
     *     rtpCapabilities
     * }
     * @response peerInfos : information of joined peers
     */
    join = 'join',

    /**
     * @ev request
     * @body {
     *     transportType : 'consumer' or 'producer'
     * }
     * @response {
     *     id
     *     iceParameters
     *     iceCandidates
     *     dtlsParameters
     *     sctpParameters
     * }
     */
    createTransport = 'createTransport',

    /**
     * @ev request
     * @body {
     *     transportId
     *     dtlsParameters
     * }
     * @response none
     */
    connectWebRtcTransport = 'connectTransport',

    /**
     * @ev request
     * @body {
     *     transportId
     *     kind
     *     rtpParameters
     *     appData : {}
     * }
     * @response producerId
     */
    produce = 'produce',

    produceData = 'produceData',
    closeProducer = 'closeProducer',
    pauseProducer = 'pauseProducer',
    resumeProducer = 'resumeProducer',
    pauseConsumer = 'pauseConsumer',
    resumeConsumer = 'resumeConsumer',
    sendMessage = 'sendMessage',
    close = 'close',
    kick = 'kick',
    mute = 'mute',
    transferHost = 'transferHost'
}

export let logger = require('log4js').getLogger();
logger.level = "debug";

