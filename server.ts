const mediasoup = require('mediasoup');
const express = require('express');
const config = require('./config/config.js')

let app = express();

let myWorker;
let myRouter;
let producerTransport;
let consumerTransport;
let producer;
let consumer;

mediasoup.createWorker(
    config.mediasoup.workerSettings
).then(
    (worker)=>{
        myWorker = worker;
        const codecs = config.mediasoup.mediaCodecs
        worker.createRouter(
            {codecs}
        ).then((router)=>{
            myRouter = router
        })
    }
)

app.get(
    '/getRouterRtpCapabilities',
    async function (req, res){
        let data = await myRouter.rtpCapabilities
        res.status(200).json(data)
    }
)

app.post(
    '/createProducerTransport',
    async function (req, res){
        const {sctpCapabilities} = req.body
        producerTransport = await myRouter.createWebRtcTransport({
            ...config.mediasoup.webRtcTransportOptions,
            enableSctp: Boolean(sctpCapabilities),
            numSctpStreams: (sctpCapabilities || {}).numStreams
        })
        await res.status(200).json(
            {
                id: producerTransport.id,
                iceParameters: producerTransport.iceParameters,
                iceCandidates: producerTransport.iceCandidates,
                dtlsParameters: producerTransport.dtlsParameters,
                sctpParameters: producerTransport.sctpParameters
            }
        )
    }
)

app.post(
    '/createConsumerTransport',
    async function (req, res){
        const {sctpCapabilities} = req.body
        consumerTransport = await myRouter.createWebRtcTransport({
            ...config.mediasoup.webRtcTransportOptions,
            enableSctp: Boolean(sctpCapabilities),
            numSctpStreams: (sctpCapabilities || {}).numStreams
        })
        await res.status(200).json(
            {
                id             : consumerTransport.id,
                iceParameters  : consumerTransport.iceParameters,
                iceCandidates  : consumerTransport.iceCandidates,
                dtlsParameters : consumerTransport.dtlsParameters,
                sctpParameters : consumerTransport.sctpParameters
            }
        )
    }
)

app.post(
    '/connectTransport',
    async function (req, res){
        const { dtlsParameters } = req.body;
        await producerTransport.connect({dtlsParameters});
        await res.status(200).json();
    }
)

app.post(
    '/createProducer',
    async function (req, res){
        const { kind, rtpParameters } = req.body;
        producer = await producerTransport.produce({kind, rtpParameters});
    }
)

app.post(
    '/createConsumer',
    async function (req, res){
        const rtpCapabilities= myRouter.rtpCapabilities;
        let id = producer.id;
        consumer = await consumerTransport.consume({id, rtpCapabilities});
        await res.status(200).json(
            {
                id            : consumer.id,
                producerId : id,
                kind          : consumer.kind,
                rtpParameters : consumer.rtpParameters,
                type          : consumer.type
            }
        )
    }
)

var server = app.listen(4443, function (){
    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})