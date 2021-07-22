"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.PeerImpl = void 0;
var events_1 = require("events");
var PeerImpl = /** @class */ (function (_super) {
    __extends(PeerImpl, _super);
    function PeerImpl(id, socket) {
        var _this = _super.call(this) || this;
        _this.joined = false;
        _this.closed = false;
        _this.transports = new Map();
        _this.producers = new Map();
        _this.consumers = new Map();
        _this.dataProducers = new Map();
        _this.dataConsumers = new Map();
        _this.id = id;
        _this.socket = socket;
        return _this;
    }
    // region Getter, Setter, Deleter
    PeerImpl.prototype.getPeerInfo = function () {
        return {
            id: this.id,
            displayName: this.displayName,
            joined: this.joined,
            closed: this.closed,
            device: this.device,
            rtpCapabilities: this.rtpCapabilities,
            sctpCapabilities: this.sctpCapabilities
        };
    };
    PeerImpl.prototype.getTransport = function (transportID) {
        if (this.transports.has(transportID)) {
            return this.transports.get(transportID);
        }
        return null;
    };
    PeerImpl.prototype.getProducer = function (producerID) {
        if (this.producers.has(producerID)) {
            return this.producers.get(producerID);
        }
        return null;
    };
    PeerImpl.prototype.getConsumer = function (consumerID) {
        if (this.consumers.has(consumerID)) {
            return this.consumers.get(consumerID);
        }
        return null;
    };
    PeerImpl.prototype.getDataProducer = function (producerID) {
        if (this.dataProducers.has(producerID)) {
            return this.dataProducers.get(producerID);
        }
        return null;
    };
    PeerImpl.prototype.getDataConsumer = function (consumerID) {
        if (this.dataConsumers.has(consumerID)) {
            return this.dataConsumers.get(consumerID);
        }
        return null;
    };
    PeerImpl.prototype.getConsumerTransport = function () {
        return Array.from(this.transports.values())
            .find(function (t) { return t.appData.transportType === 'consumer'; });
    };
    PeerImpl.prototype.getAllProducer = function () {
        return Array.from(this.producers.values());
    };
    PeerImpl.prototype.getAllDataProducer = function () {
        return Array.from(this.dataProducers.values());
    };
    PeerImpl.prototype.setTransport = function (transportID, transport) {
        this.transports.set(transportID, transport);
    };
    PeerImpl.prototype.setProducer = function (producerID, producer) {
        this.producers.set(producerID, producer);
    };
    PeerImpl.prototype.setConsumer = function (consumerID, consumer) {
        this.consumers.set(consumerID, consumer);
    };
    PeerImpl.prototype.setDataProducer = function (producerID, dataProducer) {
        this.dataProducers.set(producerID, dataProducer);
    };
    PeerImpl.prototype.setDataConsumer = function (consumerID, dataConsumer) {
        this.dataConsumers.set(consumerID, dataConsumer);
    };
    PeerImpl.prototype.setPeerInfo = function (_a) {
        var displayName = _a.displayName, joined = _a.joined, closed = _a.closed, device = _a.device, rtpCapabilities = _a.rtpCapabilities, sctpCapabilities = _a.sctpCapabilities;
        if (displayName !== undefined)
            this.displayName = displayName;
        if (joined !== undefined)
            this.joined = joined;
        if (closed !== undefined)
            this.closed = closed;
        if (device !== undefined)
            this.device = device;
        if (rtpCapabilities !== undefined)
            this.rtpCapabilities = rtpCapabilities;
        if (sctpCapabilities !== undefined)
            this.sctpCapabilities = sctpCapabilities;
    };
    PeerImpl.prototype.deleteTransport = function (transportID) {
        return this.transports["delete"](transportID);
    };
    PeerImpl.prototype.deleteProducer = function (producerID) {
        return this.producers["delete"](producerID);
    };
    PeerImpl.prototype.deleteConsumer = function (consumerID) {
        return this.consumers["delete"](consumerID);
    };
    PeerImpl.prototype.deleteDataProducer = function (producerID) {
        return this.dataProducers["delete"](producerID);
    };
    PeerImpl.prototype.deleteDataConsumer = function (consumerID) {
        return this.dataConsumers["delete"](consumerID);
    };
    // endregion
    PeerImpl.prototype.close = function () {
        this.closed = true;
        this.producers.forEach(function (producer) {
            producer.close();
        });
        this.consumers.forEach(function (consumer) {
            consumer.close();
        });
        this.dataProducers.forEach(function (producer) {
            producer.close();
        });
        this.dataConsumers.forEach(function (consumer) {
            consumer.close();
        });
        this.transports.forEach(function (transport) {
            transport.close();
        });
        this.transports.clear();
        this.producers.clear();
        this.consumers.clear();
        this.dataProducers.clear();
        this.dataConsumers.clear();
        this.emit('close');
    };
    return PeerImpl;
}(events_1.EventEmitter));
exports.PeerImpl = PeerImpl;
