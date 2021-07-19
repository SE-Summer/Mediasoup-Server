import {EventEmitter} from 'events';
import {types as MTypes} from 'mediasoup';
import {Peer} from "./peer";

export class PeerImpl extends EventEmitter implements Peer{
    id : string;
    roomID : string;
    displayName : string;
    joined : boolean = false;
    device : object;
    rtpCapabilities : MTypes.RtpCapabilities;
    transports = new Map<string, MTypes.WebRtcTransport>();
    producers = new Map<string, MTypes.Producer>();
    consumers = new Map<string, MTypes.Consumer>();
    dataProducers = new Map<string, MTypes.DataProducer>();
    dataConsumers = new Map<string, MTypes.DataConsumer>();

    constructor(id, roomId) {
        super();
        this.id = id;
        this.roomID = roomId;
    }


    // region Getter, Setter, Deleter

    getPeerInfo() {
        return {
            id : this.id,
            roomID : this.roomID,
            displayName : this.displayName,
            joined : this.joined,
            device : this.device,
            rtpCapabilities : this.rtpCapabilities
        };
    }

    getTransport (transportID:string) {
        if (this.transports.has(transportID)) {
            return this.transports.get(transportID);
        }
        return null;
    }

    getProducer (producerID:string) {
        if (this.producers.has(producerID)) {
            return this.producers.get(producerID);
        }
        return null;
    }

    getConsumer(consumerID: string) {
        if (this.consumers.has(consumerID)) {
            return this.consumers.get(consumerID);
        }
        return null;
    }

    getDataProducer(producerID: string) {
        if (this.dataProducers.has(producerID)){
            return this.dataProducers.get(producerID);
        }
        return null;
    }

    getDataConsumer(consumerID: string) {
        if (this.dataConsumers.has(consumerID)){
            return this.dataConsumers.get(consumerID);
        }
        return null;
    }

    setTransport(transportID: string, transport: MTypes.WebRtcTransport) {
        this.transports.set(transportID, transport);
    }

    setProducer(producerID: string, producer: MTypes.Producer) {
        this.producers.set(producerID, producer);
    }

    setConsumer(consumerID: string, consumer: MTypes.Consumer) {
        this.consumers.set(consumerID, consumer);
    }

    setDataProducer(producerID: string, dataProducer: MTypes.DataProducer) {
        this.dataProducers.set(producerID, dataProducer);
    }

    setDataConsumer(consumerID: string, dataConsumer: MTypes.DataConsumer) {
        this.dataConsumers.set(consumerID, dataConsumer);
    }

    setPeerInfo({
                    displayName, joined, device, rtpCapablities
    }: { displayName: any; joined: any; device: any; rtpCapablities: any; }) {
        if (displayName !== undefined)
            this.displayName = displayName;
        if (joined !== undefined)
            this.joined = joined
        if (device !== undefined)
            this.device = device
        if (rtpCapablities !== undefined)
            this.rtpCapabilities = rtpCapablities
    }

    deleteTransport (transportID:string) {
        return this.transports.delete(transportID);
    }

    deleteProducer (producerID:string) {
        return this.producers.delete(producerID);
    }

    deleteConsumer(consumerID: string) {
        return this.consumers.delete(consumerID);
    }

    deleteDataProducer(producerID: string) {
        return this.dataProducers.delete(producerID);

    }

    deleteDataConsumer(consumerID: string) {
        return this.dataConsumers.delete(consumerID);
    }

    // endregion


}
