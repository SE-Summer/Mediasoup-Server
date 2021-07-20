"use strict";
exports.__esModule = true;
exports.RequestMethod = void 0;
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
    /**
     * @ev request
     * @body {
     *     subscribeId : id of subscribed peer
     * }
     * @response subscribedInfo : information of subscribed peer
     */
    RequestMethod["consume"] = "consume";
    RequestMethod["closeProducer"] = "closeProducer";
    RequestMethod["pauseProducer"] = "pauseProducer";
    RequestMethod["resumeProducer"] = "resumeProducer";
    RequestMethod["pauseConsumer"] = "pauseConsumer";
    RequestMethod["resumeConsumer"] = "resumeConsumer";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
