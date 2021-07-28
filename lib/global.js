"use strict";
exports.__esModule = true;
exports.logger = exports.RequestMethod = void 0;
var RequestMethod;
(function (RequestMethod) {
    /**
     * @ev request
     * @body none
     * @response rtpCapabilites
     */
    RequestMethod["getRouterRtpCapabilities"] = "getRouterRtpCapabilities";
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
    RequestMethod["join"] = "join";
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
    RequestMethod["createTransport"] = "createTransport";
    /**
     * @ev request
     * @body {
     *     transportId
     *     dtlsParameters
     * }
     * @response none
     */
    RequestMethod["connectWebRtcTransport"] = "connectTransport";
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
    RequestMethod["produce"] = "produce";
    RequestMethod["produceData"] = "produceData";
    RequestMethod["closeProducer"] = "closeProducer";
    RequestMethod["pauseProducer"] = "pauseProducer";
    RequestMethod["resumeProducer"] = "resumeProducer";
    RequestMethod["pauseConsumer"] = "pauseConsumer";
    RequestMethod["resumeConsumer"] = "resumeConsumer";
    RequestMethod["sendMessage"] = "sendMessage";
    RequestMethod["close"] = "close";
    RequestMethod["kick"] = "kick";
    RequestMethod["mute"] = "mute";
    RequestMethod["transferHost"] = "transferHost";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
exports.logger = require('log4js').getLogger();
exports.logger.level = "debug";
