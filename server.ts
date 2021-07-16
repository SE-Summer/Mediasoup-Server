const https = require('https');
const url = require('url');
const protoo = require('protoo-server');
const mediasoup = require('mediasoup');
const bodyParser = require('body-parser');

let protooWebSocketServer;

const mediasoupWorkers = [];

let nextMediasoupWorkerIdx = 0;

async function run()
{

}

async function runMediasoupWorkers()
{
    const numWorkers: number = 1;

    const worker = await mediasoup.createWorker(
        'warn',
        ['info',
            'ice',
            'dtls',
            'rtp',
            'srtp',
            'rtcp',
            'rtx',
            'bwe',
            'score',
            'simulcast',
            'svc',
            'sctp'],
        process.env.MEDIASOUP_MIN_PORT || 40000,
        process.env.MEDIASOUP_MAX_PORT || 49999);

    worker.on('died', () => {
        setTimeout(() => process.exit(1));
    })

    mediasoupWorkers.push(worker);

    setInterval(async () =>
    {
        const usage = await worker.getResourceUsage();
    }, 120000);

    protoo
}

