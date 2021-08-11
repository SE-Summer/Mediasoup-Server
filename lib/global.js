"use strict";
exports.__esModule = true;
exports._notify = exports._request = exports._timeoutCallback = exports.logger = exports.RequestMethod = void 0;
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
    RequestMethod["sendText"] = "sendText";
    RequestMethod["closeRoom"] = "closeRoom";
    RequestMethod["kick"] = "kick";
    RequestMethod["mute"] = "mute";
    RequestMethod["transferHost"] = "transferHost";
    RequestMethod["restartIce"] = "restartIce";
    RequestMethod["sendFile"] = "sendFile";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
var log4js = require('log4js');
log4js.configure({
    appenders: {
        cheese: {
            type: "dateFile",
            filename: './uploads/logs/cheese',
            alwaysIncludePattern: true,
            pattern: '[yyyy-MM-dd].log',
            category: 'default',
            maxLogSize: 11024
        }
    },
    categories: {
        "default": { appenders: ["cheese"], level: "INFO" }
    }
});
exports.logger = require('log4js').getLogger();
exports.logger.level = "debug";
function _timeoutCallback(callback) {
    var called = false;
    var interval = setTimeout(function () {
        if (called) {
            return;
        }
        called = true;
        callback(new Error('Request timeout.'));
    }, 10000);
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (called) {
            return;
        }
        called = true;
        clearTimeout(interval);
        callback.apply(void 0, args);
    };
}
exports._timeoutCallback = _timeoutCallback;
function _request(socket, method, data) {
    var _this = this;
    if (data === void 0) { data = {}; }
    return new Promise(function (resolve, reject) {
        socket.emit('request', { method: method, data: data }, _this._timeoutCallback(function (err, response) {
            if (err) {
                reject(err);
            }
            else {
                resolve(response);
            }
        }));
    });
}
exports._request = _request;
function _notify(socket, method, data, broadcast, roomId) {
    if (data === void 0) { data = {}; }
    if (broadcast === void 0) { broadcast = false; }
    if (roomId === void 0) { roomId = undefined; }
    if (broadcast) {
        socket.broadcast.to(roomId).emit('notify', { method: method, data: data });
    }
    else
        socket.emit('notify', { method: method, data: data });
}
exports._notify = _notify;
