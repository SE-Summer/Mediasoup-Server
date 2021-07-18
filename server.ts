
const mediasoup = require('mediasoup');
const express = require('express');
const config = require('./config/config.js')
const protoo = require('protoo-server');

let app = express();

let myWorker;
let myRouter;
let producerTransport;
let consumerTransport;
let producer;
let consumer;
// let protooServer;
// let peer;
// let protooRoom;
// let protooTransport;

mediasoup.createWorker(
    config.mediasoup.workerSettings
).then(
    (worker)=>{
        myWorker = worker;
        const {mediaCodecs} = config.mediasoup.routerOptions
        worker.createRouter(
            {mediaCodecs}
        ).then((router)=>{
            myRouter = router
        })
    }
)



app.use(express.json());

app.get(
    '/getRouterRtpCapabilities',
    async function (req, res){
        let data = await myRouter.rtpCapabilities
        res.status(200).json(data)
    }
)

app.post(
    '/createProducerTransport',
    async (req, res, next)=>{
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
        console.log('[Connect]')
        console.log(req.body)
        await producerTransport.connect({dtlsParameters});
        await res.status(200).json({});
    }
)

app.post(
    '/createProducer',
    async function (req, res){
        const { kind, rtpParameters } = req.body;
        console.log('[createProducer]')
        console.log(req.body)
        producer = await producerTransport.produce({kind, rtpParameters});
        await res.status(200).json({id: producer.id});
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

app.post(
    '/produce',
    async (req, res)=>{
        let {kind,rtpParameters, appData} = req.body;
        console.log('[Produce]');
        console.log(req.body);
        const producer = await producerTransport.produce(
            {
                kind,
                rtpParameters,
                appData
            }
        )
        const id = producer.id
        await res.status(200).json({id})
    }
)


// protooServer = new protoo.WebSocketServer(app,
//     {
//         maxReceivedFrameSize     : 960000, // 960 KBytes.
//         maxReceivedMessageSize   : 960000,
//         fragmentOutgoingMessages : true,
//         fragmentationThreshold   : 960000
//     });
//
// protooServer.on('connectionrequest', (info, accept, reject) => {
//     protooTransport =  accept();
//     handleProtooConnection();
// })
//
// function handleProtooConnection() {
//     protooRoom = new protoo.Room();
//
//     peer = protooRoom.createPeer(1,protooTransport);
//
//     peer.on('request', (request, accept, reject) => {
//         handleProtooRequest(peer, request, accept, reject);
//     })
// }

var server = app.listen(4443, function (){
    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})

// async function handleProtooRequest (peer, request, accept, reject)
// {
//     switch (request.method)
//     {
//         case 'produce':
//         {
//             const {kind, rtpParameters} = request.data;
//             let {appData} = request.data;
//             console.log(appData);
//             producer = await producerTransport.produce(
//                 {
//                     kind,
//                     rtpParameters,
//                     appData
//                 }
//             );
//         }
//     }
// }